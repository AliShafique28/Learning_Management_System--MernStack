const express = require('express');
const router = express.Router();
const {
  getMyCertificates,
  getCertificateById,
  verifyCertificate,
  downloadCertificate
} = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

// @route   GET /api/certificates/my-certificates
// @desc    Get student's certificates
// @access  Private/Student
router.get('/my-certificates', protect, roleCheck('student'), getMyCertificates);

// @route   GET /api/certificates/verify/:certificateId
// @desc    Verify certificate by certificate ID
// @access  Public
router.get('/verify/:certificateId', verifyCertificate);

// @route   GET /api/certificates/:id
// @desc    Get certificate by ID
// @access  Public
router.get('/:id', getCertificateById);

// @route   GET /api/certificates/:id/download
// @desc    Download certificate PDF
// @access  Private/Student
router.get('/:id/download', protect, roleCheck('student'), downloadCertificate);

module.exports = router;
