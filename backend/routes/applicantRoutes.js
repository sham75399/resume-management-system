const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  createApplicant,
  getApplicants,
  getApplicantById,
  updateApplicant,
  deleteApplicant,
  downloadResume
} = require('../controllers/applicantController');

// Public routes (all authenticated users)
router.route('/')
  .post(protect, upload.single('resume'), createApplicant)
  .get(protect, getApplicants);

router.route('/:id')
  .get(protect, getApplicantById)
  .put(protect, upload.single('resume'), updateApplicant)
  .delete(protect, authorize('admin'), deleteApplicant); // Only admin can delete

router.get('/:id/download', protect, downloadResume);

module.exports = router;