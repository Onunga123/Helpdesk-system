const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const getUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive) filter.isActive = req.query.isActive === "true";
  if (req.query.department) filter.department = req.query.department;
  const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
  res.json({ success: true, count: users.length, data: users });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) { res.status(404); throw new Error("User not found"); }
  res.json({ success: true, data: user });
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department, phone } = req.body;
  if (!name || !email || !password) { res.status(400); throw new Error("Please provide name, email and password"); }
  const userExists = await User.findOne({ email });
  if (userExists) { res.status(400); throw new Error("A user with this email already exists"); }
  const user = await User.create({ name, email, password, role: role || "student", department: department || "", phone: phone || "" });
  res.status(201).json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role, department: user.department, phone: user.phone, isActive: user.isActive } });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  user.name = req.body.name || user.name;
  user.email = req.body.email || user.email;
  user.role = req.body.role || user.role;
  user.department = req.body.department || user.department;
  user.phone = req.body.phone || user.phone;
  if (typeof req.body.isActive === "boolean") user.isActive = req.body.isActive;
  if (req.body.password) user.password = req.body.password;
  const updatedUser = await user.save();
  res.json({ success: true, data: { _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role, department: updatedUser.department, phone: updatedUser.phone, isActive: updatedUser.isActive } });
});

const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) { res.status(404); throw new Error("User not found"); }
  if (user._id.toString() === req.user._id.toString()) { res.status(400); throw new Error("You cannot delete your own account"); }
  await user.deleteOne();
  res.json({ success: true, message: "User " + user.name + " deleted successfully" });
});

const getUserStats = asyncHandler(async (req, res) => {
  const byRole = await User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]);
  const byStatus = await User.aggregate([{ $group: { _id: "$isActive", count: { $sum: 1 } } }]);
  const totalUsers = await User.countDocuments();
  res.json({ success: true, data: { total: totalUsers, byRole, byStatus } });
});

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getUserStats };
