const express = require("express");
const protect = require("../middleware/auth_middleware");
const { getSuggestions } = require("../controllers/suggestion_controller");

const router = express.Router();

router.use(protect);
router.post("/", getSuggestions);

module.exports = router;