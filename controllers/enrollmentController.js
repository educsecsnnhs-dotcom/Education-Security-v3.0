// controllers/enrollmentController.js
const Enrollment = require("../models/Enrollment");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");

/**
 * Student submits enrollment (multipart/form-data files handled by multer)
 * Expects files in req.files: reportCard, goodMoral, birthCertificate, others[]
 */
exports.submitEnrollment = async (req, res) => {
  try {
    const { level, strand, schoolYear, yearLevel } = req.body;
    const studentId = req.session.user?.id;

    if (!studentId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(studentId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Prevent duplicate application for same school year
    const existing = await Enrollment.findOne({ lrn: user.lrn, schoolYear });
    if (existing) return res.status(400).json({ message: "You already applied for this school year" });

    // Collect file names (multer stored files)
    const files = req.files || {};
    const docs = {
      reportCard: files.reportCard?.[0]?.filename || null,
      goodMoral: files.goodMoral?.[0]?.filename || null,
      birthCertificate: files.birthCertificate?.[0]?.filename || null,
      others: (files.others || []).map(f => f.filename),
    };

    const enrollment = new Enrollment({
      studentId: user._id,
      name: user.fullName,
      lrn: user.lrn,
      level,
      strand,
      section: null,
      schoolYear,
      yearLevel: yearLevel || null,
      status: "pending",
      documents: {
        reportCard: docs.reportCard,
        goodMoral: docs.goodMoral,
        birthCertificate: docs.birthCertificate,
        others: docs.others,
      },
    });

    await enrollment.save();
    res.status(201).json({ message: "Enrollment submitted", enrollment });
  } catch (err) {
    console.error("submitEnrollment error:", err);
    res.status(500).json({ message: "Error submitting enrollment", error: err.message });
  }
};

/**
 * Student can view their own enrollment (latest for current school year)
 */
exports.getMyEnrollment = async (req, res) => {
  try {
    const studentId = req.session.user?.id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });

    const rec = await Enrollment.findOne({ studentId }).sort({ createdAt: -1 });
    if (!rec) return res.status(404).json({ message: "No enrollment found" });

    res.json(rec);
  } catch (err) {
    res.status(500).json({ message: "Error fetching enrollment", error: err.message });
  }
};
