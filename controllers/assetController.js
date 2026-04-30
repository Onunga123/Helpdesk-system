const asyncHandler = require('express-async-handler');
const Asset = require('../models/assetModel');
const User = require('../models/userModel');

const createAsset = asyncHandler(async (req, res) => {
  const {
    name, category, brand, model, serialNumber,
    specifications, condition, location, department,
    purchaseDate, purchasePrice, vendor, warrantyExpiry, notes,
  } = req.body;

  if (!name || !category) {
    res.status(400);
    throw new Error('Please provide asset name and category');
  }

  const asset = await Asset.create({
    name, category, brand, model, serialNumber,
    specifications, condition, location, department,
    purchaseDate, purchasePrice, vendor, warrantyExpiry,
    notes, addedBy: req.user._id,
  });

  const populatedAsset = await Asset.findById(asset._id)
    .populate('addedBy', 'name role')
    .populate('assignedTo', 'name email department');

  res.status(201).json({
    success: true,
    data: populatedAsset,
  });
});

const getAssets = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.condition) filter.condition = req.query.condition;

  if (req.query.search) {
    filter.$or = [
      { assetTag: { $regex: req.query.search, $options: 'i' } },
      { name: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const assets = await Asset.find(filter)
    .populate('assignedTo', 'name email department')
    .populate('addedBy', 'name role')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: assets.length,
    data: assets,
  });
});

const getAssetById = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id)
    .populate('assignedTo', 'name email role department phone')
    .populate('addedBy', 'name role')
    .populate('maintenanceHistory.performedBy', 'name role');

  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  res.json({
    success: true,
    data: asset,
  });
});

const updateAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  const {
    name, category, brand, model, serialNumber,
    specifications, condition, status, location,
    department, purchaseDate, purchasePrice,
    vendor, warrantyExpiry, notes,
  } = req.body;

  if (status) {
    if (status === 'Assigned') {
      res.status(400);
      throw new Error(
        'Use PUT /api/assets/:id/assign to assign an asset to a user'
      );
    }
    if (status === 'Available' && asset.assignedTo) {
      res.status(400);
      throw new Error(
        'Asset is currently assigned. Use PUT /api/assets/:id/unassign first'
      );
    }
    asset.status = status;
  }

  if (name) asset.name = name;
  if (category) asset.category = category;
  if (brand) asset.brand = brand;
  if (model) asset.model = model;
  if (serialNumber) asset.serialNumber = serialNumber;
  if (specifications) asset.specifications = specifications;
  if (condition) asset.condition = condition;
  if (location) asset.location = location;
  if (department) asset.department = department;
  if (purchaseDate) asset.purchaseDate = purchaseDate;
  if (purchasePrice) asset.purchasePrice = purchasePrice;
  if (vendor) asset.vendor = vendor;
  if (warrantyExpiry) asset.warrantyExpiry = warrantyExpiry;
  if (notes) asset.notes = notes;

  const updatedAsset = await asset.save();

  const populated = await Asset.findById(updatedAsset._id)
    .populate('assignedTo', 'name email department')
    .populate('addedBy', 'name role');

  res.json({
    success: true,
    data: populated,
  });
});

const assignAsset = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400);
    throw new Error('Please provide a userId to assign the asset to');
  }

  const userToAssign = await User.findById(userId);
  if (!userToAssign) {
    res.status(404);
    throw new Error('User not found. Please provide a valid userId');
  }

  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  if (asset.status === 'Decommissioned') {
    res.status(400);
    throw new Error('Cannot assign a decommissioned asset');
  }

  if (asset.status === 'Under Repair') {
    res.status(400);
    throw new Error('Cannot assign an asset that is under repair');
  }

  if (
    asset.assignedTo &&
    asset.assignedTo.toString() !== userId.toString()
  ) {
    res.status(400);
    throw new Error(
      `Asset is already assigned to another user. ` +
      `Unassign it first using PUT /api/assets/${req.params.id}/unassign`
    );
  }

  asset.assignedTo = userId;
  asset.assignedDate = new Date();
  asset.status = 'Assigned';

  await asset.save();

  const populated = await Asset.findById(asset._id)
    .populate('assignedTo', 'name email role department')
    .populate('addedBy', 'name role');

  res.json({
    success: true,
    message: `Asset assigned to ${userToAssign.name} successfully`,
    data: populated,
  });
});

const unassignAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  if (!asset.assignedTo) {
    res.status(400);
    throw new Error('This asset is not currently assigned to anyone');
  }

  asset.assignedTo = null;
  asset.assignedDate = null;
  asset.status = 'Available';

  await asset.save();

  const populated = await Asset.findById(asset._id)
    .populate('addedBy', 'name role');

  res.json({
    success: true,
    message: 'Asset unassigned and returned to Available successfully',
    data: populated,
  });
});

const addMaintenanceRecord = asyncHandler(async (req, res) => {
  const { description, cost, nextMaintenanceDate, condition } = req.body;

  if (!description) {
    res.status(400);
    throw new Error('Please provide a maintenance description');
  }

  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  const maintenanceRecord = {
    description,
    performedBy: req.user._id,
    performedByName: req.user.name,
    cost: cost || 0,
    nextMaintenanceDate: nextMaintenanceDate || null,
  };

  asset.maintenanceHistory.push(maintenanceRecord);

  if (condition) asset.condition = condition;

  if (asset.status !== 'Decommissioned') {
    if (asset.status === 'Under Repair') {
      asset.status = asset.assignedTo ? 'Assigned' : 'Available';
    }
  }

  await asset.save();

  const populated = await Asset.findById(asset._id)
    .populate('assignedTo', 'name email')
    .populate('maintenanceHistory.performedBy', 'name role');

  res.status(201).json({
    success: true,
    message: 'Maintenance record added successfully',
    data: populated,
  });
});

const deleteAsset = asyncHandler(async (req, res) => {
  const asset = await Asset.findById(req.params.id);

  if (!asset) {
    res.status(404);
    throw new Error('Asset not found');
  }

  if (asset.assignedTo) {
    res.status(400);
    throw new Error(
      'Cannot delete an asset that is currently assigned to a user. Unassign it first.'
    );
  }

  await asset.deleteOne();

  res.json({
    success: true,
    message: `Asset ${asset.assetTag} deleted successfully`,
  });
});

const getAssetStats = asyncHandler(async (req, res) => {
  const statusStats = await Asset.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const categoryStats = await Asset.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const conditionStats = await Asset.aggregate([
    { $group: { _id: '$condition', count: { $sum: 1 } } },
  ]);

  const departmentStats = await Asset.aggregate([
    { $match: { department: { $ne: '' } } },
    { $group: { _id: '$department', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const totalValue = await Asset.aggregate([
    { $group: { _id: null, total: { $sum: '$purchasePrice' } } },
  ]);

  const expiredWarranties = await Asset.countDocuments({
    warrantyExpiry: { $lt: new Date() },
    status: { $ne: 'Decommissioned' },
  });

  const overdueMaintenanceAssets = await Asset.countDocuments({
    'maintenanceHistory.nextMaintenanceDate': { $lt: new Date() },
    status: { $ne: 'Decommissioned' },
  });

  const totalAssets = await Asset.countDocuments();

  res.json({
    success: true,
    data: {
      total: totalAssets,
      totalValue: totalValue[0]?.total || 0,
      expiredWarranties,
      overdueMaintenanceAssets,
      byStatus: statusStats,
      byCategory: categoryStats,
      byCondition: conditionStats,
      byDepartment: departmentStats,
    },
  });
});

module.exports = {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  assignAsset,
  unassignAsset,
  addMaintenanceRecord,
  deleteAsset,
  getAssetStats,
};
