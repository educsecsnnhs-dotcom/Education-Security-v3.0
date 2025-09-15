// models/Enrollment.js
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    lrn: { type: String, required: true, minlength: 12, maxlength: 12 },
    level: { type: String, enum: ["junior", "senior"], required: true },
    strand: { type: String },
    section: { type: String, default: null },
    schoolYear: { type: String, required: true },
    yearLevel: { type: Number },

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },

    documents: {
      reportCard: { type: String },
      goodMoral: { type: String },
      birthCertificate: { type: String },
      others: [{ type: String }],
    },

    graduated: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
    archiveReason: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);
