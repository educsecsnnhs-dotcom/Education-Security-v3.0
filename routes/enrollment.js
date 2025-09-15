// routes/enrollment.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const enrollmentCtrl = require("../controllers/enrollmentController");
const { authRequired, requireRole } = require("../middleware/authMiddleware");

// file storage and 5MB limit
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/enrollments/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Student submits enrollment with documents
router.post("/", authRequired, requireRole("Student"), upload.fields([
  { name: "reportCard", maxCount: 1 },
  { name: "goodMoral", maxCount: 1 },
  { name: "birthCertificate", maxCount: 1 },
  { name: "others", maxCount: 5 },
]), enrollmentCtrl.submitEnrollment);

// Student checks their enrollment status
router.get("/me", authRequired, requireRole("Student"), enrollmentCtrl.getMyEnrollment);

module.exports = router;
