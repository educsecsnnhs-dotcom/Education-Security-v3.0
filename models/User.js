// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    lrn: { type: String }, // for Students
    password: { type: String, required: true },
    role: {
      type: String,
      enum: [
        "User",
        "Student",
        "Registrar",
        "Admin",
        "SuperAdmin",
        "SSG",
        "Moderator",
      ],
      default: "User",
    },
    section: { type: mongoose.Schema.Types.ObjectId, ref: "Section", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
