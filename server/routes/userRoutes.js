const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/stats", userController.getUserStats);
router.get("/", userController.getUsers);
router.post("/", userController.createUser);
router.get("/:id", userController.getUserById);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

module.exports = router;
