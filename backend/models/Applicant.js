const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  skills: [{
    type: String
  }],
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Applied', 'Interview', 'Hired', 'Rejected'],
    default: 'Applied'
  },
  resumeUrl: {
    type: String,
    required: true
  },
  resumeOriginalName: {
    type: String
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Applicant', applicantSchema);