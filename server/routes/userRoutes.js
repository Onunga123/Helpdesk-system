const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadProfileImage } = require("../middleware/uploadMiddleware");

router.use(protect);

// Self-service account routes (any authenticated user) — must be registered before /:id
router.get("/me", userController.getCurrentUserProfile);
router.put("/me", userController.updateCurrentUserProfile);
router.put("/change-password", userController.changeCurrentUserPassword);
router.put("/preferences", userController.updateCurrentUserPreferences);
router.post("/profile-image", uploadProfileImage, userController.uploadCurrentUserProfileImage);
router.post("/logout-all-sessions", userController.logoutAllSessions);

// Allow ict_officer to view the users list (needed for ticket assignment dropdown),
// but keep create/update/delete restricted to admins.
router.get("/stats", authorize("admin"), userController.getUserStats);
router.get("/", authorize("admin", "ict_officer"), userController.getUsers);
router.post("/", authorize("admin"), userController.createUser);
router.get("/:id", authorize("admin"), userController.getUserById);
router.put("/:id", authorize("admin"), userController.updateUser);
router.delete("/:id", authorize("admin"), userController.deleteUser);

module.exports = router;
