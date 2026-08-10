const Applicant = require('../models/Applicant');

const getDashboardStats = async (req, res) => {
  try {
    const totalApplicants = await Applicant.countDocuments();
    
    const statusCounts = await Applicant.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentApplicants = await Applicant.find()
      .sort('-createdAt')
      .limit(5)
      .select('firstName lastName status createdAt');

    // Convert status counts array to object
    const statusObject = {};
    statusCounts.forEach(item => {
      statusObject[item._id] = item.count;
    });

    res.json({
      totalApplicants,
      statusCounts: statusObject,
      recentApplicants
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboardStats };