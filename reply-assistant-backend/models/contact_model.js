const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    platform: {
      type: String,
      enum: ["whatsapp", "instagram"],
      required: true,
    },
    contactName: {
      type: String,
      required: true,
      trim: true,
    },
    profileNotes: {
      type: String,
      default: "",
    },
    tonePreference: {
      type: String,
      enum: ["casual", "formal", "playful", "brief"],
      default: "casual",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Contact", contactSchema);