const asyncHandler = require("express-async-handler");
const Asset = require("../models/assetModel");

const createAsset = asyncHandler(async (req, res) => {
  const { name, category, brand, model, serialNumber, specifications, condition, location, department, purchaseDate, purchasePrice, vendor, warrantyExpiry, notes } = req.body;
  if (!name || !category) { res.status(400); throw new Error("Please provide asset name and category"); }
  const asset = await Asset.create({ name, category, brand, model, serialNumber, specifications, condition, location, department, purchaseDate, purchasePrice, vendor, warrantyExpiry, notes, addedBy: req.user._id });
  const populated = await Asset.findById(asset._id).populate("addedBy", "name role").populate("assignedTo", "name email department");
  res.status(201).json({ success: true, data: populated });
});

const getAssets = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.condition) filter.condition = req.query.condition;
  const assets = await Asset.find(filter).populate("assignedTo", "name email department").populate("addedBy", "name role").sort({ createdAt: -1 });
  res.json({ success: true, count: assets.length, data: assets });
});

const getAssetById = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id).populate("assignedTo", "name email role department phone").populate("addedBy", "name role").populate("maintenanceHistory.performedBy", "name role");
  if (!asset) { res.status(404); throw new Error("Asset not found"); }
  res.json({ success: true, data: asset });
});

const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) { res.status(404); throw new Error("Asset not found"); }
  const fields = ["name", "category", "brand", "model", "serialNumber", "specifications", "condition", "status", "location", "department", "purchaseDate", "purchasePrice", "vendor", "warrantyExpiry", "notes"];
  fields.forEach((f) => { if (req.body[f] !== undefined) asset[f] = req.body[f]; });
  const updated = await asset.save();
  const populated = await Asset.findById(updated._id).populate("assignedTo", "name email department").populate("addedBy", "name role");
  res.json({ success: true, data: populated });
});

const assignAsset = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  if (!userId) { res.status(400); throw new Error("Please provide a userId"); }
  const asset = await Asset.findById(req.params.id);
  if (!asset) { res.status(404); throw new Error("Asset not found"); }
  if (asset.status === "Decommissioned") { res.status(400); throw new Error("Cannot assign a decommissioned asset"); }
  asset.assignedTo = userId;
  asset.assignedDate = new Date();
  asset.status = "Assigned";
  await asset.save();
  const populated = await Asset.findById(asset._id).populate("assignedTo", "name email role department").populate("addedBy", "name role");
  res.json({ success: true, message: "Asset assigned successfully", data: populated });
});

const unassignAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) { res.status(404); throw new Error("Asset not found"); }
  if (!asset.assignedTo) { res.status(400); throw new Error("This asset is not currently assigned"); }
  asset.assignedTo = null;
  asset.assignedDate = null;
  asset.status = "Available";
  await asset.save();
  res.json({ success: true, message: "Asset unassigned successfully", data: asset });
});

const addMaintenanceRecord = asyncHandler(async (req, res) => {
  const { description, cost, nextMaintenanceDate } = req.body;
  if (!description) { res.status(400); throw new Error("Please provide a maintenance description"); }
  const asset = await Asset.findById(req.params.id);
  if (!asset) { res.status(404); throw new Error("Asset not found"); }
  asset.maintenanceHistory.push({ description, performedBy: req.user._id, performedByName: req.user.name, cost: cost || 0, nextMaintenanceDate: nextMaintenanceDate || null });
  if (asset.status !== "Decommissioned") { asset.status = "Available"; if (req.body.condition) asset.condition = req.body.condition; }
  await asset.save();
  const populated = await Asset.findById(asset._id).populate("assignedTo", "name email").populate("maintenanceHistory.performedBy", "name role");
  res.status(201).json({ success: true, message: "Maintenance record added", data: populated });
});

const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);
  if (!asset) { res.status(404); throw new Error("Asset not found"); }
  await asset.deleteOne();
  res.json({ success: true, message: "Asset " + asset.assetTag + " deleted successfully" });
});

const getAssetStats = asyncHandler(async (req, res) => {
  const byStatus = await Asset.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  const byCategory = await Asset.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]);
  const byCondition = await Asset.aggregate([{ $group: { _id: "$condition", count: { $sum: 1 } } }]);
  const byDepartment = await Asset.aggregate([{ $match: { department: { $ne: "" } } }, { $group: { _id: "$department", count: { $sum: 1 } } }, { $sort: { count: -1 } }]);
  const totalValueResult = await Asset.aggregate([{ $group: { _id: null, total: { $sum: "$purchasePrice" } } }]);
  const totalAssets = await Asset.countDocuments();
  res.json({ success: true, data: { total: totalAssets, totalValue: totalValueResult[0]?.total || 0, byStatus, byCategory, byCondition, byDepartment } });
});

module.exports = { createAsset, getAssets, getAssetById, updateAsset, assignAsset, unassignAsset, addMaintenanceRecord, deleteAsset, getAssetStats };
