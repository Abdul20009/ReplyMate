const Contact = require("../models/contact_model");

// @route   POST /api/contacts
// @desc    Create a new contact profile
// @access  Private
const createContact = async (req, res) => {
  try {  
    const { platform, contactName, profileNotes, tonePreference } = req.body;

    // 1. Validate input
    if (!platform || !contactName) {
      return res.status(400).json({
        success: false,
        message: "Platform and contact name are required",
      });
    }

    // 2. Create contact, tied to the logged-in user
    const contact = await Contact.create({
      userId: req.user.id,
      platform,
      contactName,
      profileNotes,
      tonePreference,
    });

    // 3. Send response
    return res.status(201).json({
      success: true,
      message: "Contact created successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Create contact error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @route   GET /api/contacts
// @desc    Get all contacts belonging to the logged-in user
// @access  Private
const getContacts = async (req, res) => {
  try {
    // 1. Fetch contacts scoped to this user only
    const contacts = await Contact.find({ userId: req.user.id }).sort({ createdAt: -1 });

    // 2. Send response
    return res.status(200).json({
      success: true,
      message: "Contacts fetched successfully",
      data: contacts,
    });
  } catch (error) {
    console.error("Get contacts error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @route   PUT /api/contacts/:id
// @desc    Update a contact profile
// @access  Private
const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { contactName, profileNotes, tonePreference } = req.body;

    // 1. Find contact, ensure it belongs to this user
    const contact = await Contact.findOne({ _id: id, userId: req.user.id });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // 2. Update allowed fields only
    if (contactName !== undefined) contact.contactName = contactName;
    if (profileNotes !== undefined) contact.profileNotes = profileNotes;
    if (tonePreference !== undefined) contact.tonePreference = tonePreference;

    await contact.save();

    // 3. Send response
    return res.status(200).json({
      success: true,
      message: "Contact updated successfully",
      data: contact,
    });
  } catch (error) {
    console.error("Update contact error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @route   DELETE /api/contacts/:id
// @desc    Delete a contact profile
// @access  Private
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find and delete, scoped to this user
    const contact = await Contact.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // 2. Send response
    return res.status(200).json({
      success: true,
      message: "Contact deleted successfully",
    });
  } catch (error) {
    console.error("Delete contact error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { createContact, getContacts, updateContact, deleteContact };