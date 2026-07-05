const express = require("express");
const protect = require("../middleware/auth_middleware");
const { getMe, updateProfile } = require("../controllers/user_controller");

const router = express.Router();

router.use(protect);
router.get("/me", getMe);
router.put("/me", updateProfile);

module.exports = router;