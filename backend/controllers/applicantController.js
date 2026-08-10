const Applicant = require('../models/Applicant');
const fs = require('fs');

const createApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      skills: req.body.skills ? req.body.skills.split(',').map(s => s.trim()) : [],
      experience: parseInt(req.body.experience),
      status: req.body.status || 'Applied',
      notes: req.body.notes,
      resumeUrl: req.file.path,
      resumeOriginalName: req.file.originalname,
      createdBy: req.user._id
    });

    res.status(201).json(applicant);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getApplicants = async (req, res) => {
  try {
    const { name, skills, status } = req.query;
    let query = {};

    if (name) {
      query.$or = [
        { firstName: new RegExp(name, 'i') },
        { lastName: new RegExp(name, 'i') }
      ];
    }

    if (skills) {
      const skillArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillArray };
    }

    if (status) {
      query.status = status;
    }

    const applicants = await Applicant.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.json(applicants);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const getApplicantById = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }
    
    res.json(applicant);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const updateApplicant = async (req, res) => {
  try {
    let applicant = await Applicant.findById(req.params.id);
    
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    const updateData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      skills: req.body.skills ? req.body.skills.split(',').map(s => s.trim()) : [],
      experience: parseInt(req.body.experience),
      status: req.body.status,
      notes: req.body.notes,
      updatedAt: Date.now()
    };

    if (req.file) {
      // Delete old resume
      if (applicant.resumeUrl && fs.existsSync(applicant.resumeUrl)) {
        fs.unlinkSync(applicant.resumeUrl);
      }
      updateData.resumeUrl = req.file.path;
      updateData.resumeOriginalName = req.file.originalname;
    }

    applicant = await Applicant.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(applicant);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteApplicant = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    // Delete resume file
    if (applicant.resumeUrl && fs.existsSync(applicant.resumeUrl)) {
      fs.unlinkSync(applicant.resumeUrl);
    }

    await applicant.deleteOne();
    res.json({ message: 'Applicant removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

const downloadResume = async (req, res) => {
  try {
    const applicant = await Applicant.findById(req.params.id);
    
    if (!applicant) {
      return res.status(404).json({ message: 'Applicant not found' });
    }

    res.download(applicant.resumeUrl, applicant.resumeOriginalName);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createApplicant,
  getApplicants,
  getApplicantById,
  updateApplicant,
  deleteApplicant,
  downloadResume
};