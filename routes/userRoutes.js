const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
// Allow ict_officer to view the users list (needed for ticket assignment dropdown),
// but keep create/update/delete restricted to admins.
router.get("/stats", authorize("admin"), userController.getUserStats);
router.get("/", authorize("admin", "ict_officer"), userController.getUsers);
router.post("/", authorize("admin"), userController.createUser);
router.get("/:id", authorize("admin"), userController.getUserById);
router.put("/:id", authorize("admin"), userController.updateUser);
router.delete("/:id", authorize("admin"), userController.deleteUser);

module.exports = router;