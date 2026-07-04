const express = require("express");
const protect = require("../middleware/auth_middleware");
const {
  createContact,
  getContacts,
  updateContact,
  deleteContact,
} = require("../controllers/contact_controller");

const router = express.Router();

// all contact routes require a logged-in user
router.use(protect);

router.post("/", createContact);
router.get("/", getContacts);
router.put("/:id", updateContact);
router.delete("/:id", deleteContact);

module.exports = router;