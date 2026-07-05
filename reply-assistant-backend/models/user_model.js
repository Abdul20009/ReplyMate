const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    apiUsageCount: {
      type: Number,
      default: 0,
    },
    // ─── Onboarding profile: helps the AI match the user's own voice ───
    profile: {
      age: {
        type: Number,
        default: null,
      },
      occupation: {
        type: String,
        default: "",
        trim: true,
      },
      communicationStyle: {
        type: String,
        default: "", // e.g. "I'm direct and blunt, I don't use a lot of emojis"
        trim: true,
      },
      onboardingCompleted: {
        type: Boolean,
        default: false,
      },
    },
  },
  { timestamps: true }
);

// ─── Hash password before saving ───────────────────────────
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return; // skip if password wasn't changed

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // no next() needed — Mongoose 9 waits for this async function to resolve
  // if bcrypt throws, Mongoose automatically rejects the .save() call
});

// ─── Instance method to compare login password with stored hash ───
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);