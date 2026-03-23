const path = require('path');
const fs = require('fs');
const Certificate = require('../models/Certificate');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

// @desc    Get student's certificates
// @route   GET /api/certificates/my-certificates
// @access  Private/Student
const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('course', 'title instructor')
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name' }
      })
      .sort('-issuedAt');

    res.status(200).json({
      success: true,
      count: certificates.length,
      data: certificates
    });
  } catch (error) {
    console.error('Get My Certificates Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get certificate by ID
// @route   GET /api/certificates/:id
// @access  Public (for verification)
const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'name email')
      .populate('course', 'title')
      .populate({
        path: 'course',
        populate: { path: 'instructor', select: 'name' }
      });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    res.status(200).json({
      success: true,
      data: certificate
    });
  } catch (error) {
    console.error('Get Certificate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Verify certificate by certificate ID
// @route   GET /api/certificates/verify/:certificateId
// @access  Public
const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      certificateId: req.params.certificateId 
    })
      .populate('student', 'name email')
      .populate('course', 'title');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate is valid',
      data: {
        studentName: certificate.student.name,
        courseName: certificate.course.title,
        issuedAt: certificate.issuedAt,
        certificateId: certificate.certificateId
      }
    });
  } catch (error) {
    console.error('Verify Certificate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Download certificate PDF
// @route   GET /api/certificates/:id/download
// @access  Private/Student
const downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    if (certificate.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!certificate.pdfUrl) {
      return res.status(400).json({ success: false, message: 'Certificate file not available yet' });
    }

    const relativePath = certificate.pdfUrl.replace(/^\/+/g, '');
    const pdfPath = path.join(__dirname, '..', relativePath);

    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ success: false, message: 'Certificate file not found' });
    }

    return res.download(pdfPath, path.basename(pdfPath));
  } catch (error) {
    console.error('Download Certificate Error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
// const downloadCertificate = async (req, res) => {
//   try {
//     const certificate = await Certificate.findById(req.params.id);

//     if (!certificate) {
//       return res.status(404).json({
//         success: false,
//         message: 'Certificate not found'
//       });
//     }

//     // Check if user owns this certificate
//     if (certificate.student.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'Not authorized to download this certificate'
//       });
//     }

//     // Return PDF URL
//     res.status(200).json({
//       success: true,
//       data: {
//         pdfUrl: certificate.pdfUrl
//       }
//     });
//   } catch (error) {
//     console.error('Download Certificate Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

module.exports = {
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
  downloadCertificate
};
