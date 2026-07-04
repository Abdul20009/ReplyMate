const mongoose = require("mongoose");

const suggestionLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
    },
    platform: {
      type: String,
      enum: ["whatsapp", "instagram"],
      required: true,
    },
    // deliberately NOT storing message content — usage tracking only
  },
  { timestamps: true }
);

module.exports = mongoose.model("SuggestionLog", suggestionLogSchema);