const express = require("express");
const router = express.Router();
const { createAsset, getAssets, getAssetById, updateAsset, assignAsset, unassignAsset, addMaintenanceRecord, deleteAsset, getAssetStats } = require("../controllers/assetController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin", "ict_officer"));

router.get("/stats", getAssetStats);
router.route("/").get(getAssets).post(createAsset);
router.route("/:id").get(getAssetById).put(updateAsset).delete(authorize("admin"), deleteAsset);
router.put("/:id/assign", assignAsset);
router.put("/:id/unassign", unassignAsset);
router.post("/:id/maintenance", addMaintenanceRecord);

module.exports = router;