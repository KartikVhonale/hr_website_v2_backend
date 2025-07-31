const User = require('../models/User');
const Employer = require('../models/Employer');
const Jobseeker = require('../models/Jobseeker');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { NotFoundError } = require('../errors');

const getSavedCandidates = async (req, res) => {
  const { userId } = req.user;

  // Find the employer profile for this user
  let employer = await Employer.findOne({ userId }).populate({
    path: 'savedCandidates',
    populate: {
      path: 'userId',
      select: 'name email'
    }
  });

  // If employer profile doesn't exist, create one
  if (!employer) {
    // Get user info for default company name
    const user = await User.findById(userId);
    employer = await Employer.create({
      userId,
      companyName: user?.name ? `${user.name}'s Company` : 'My Company',
      savedCandidates: []
    });
  }

  // Get applications for each saved candidate
  const candidatesWithStatus = await Promise.all(
    employer.savedCandidates.map(async (candidate) => {
      const application = await Application.findOne({
        jobseeker: candidate._id,
        employer: userId
      }).select('status notes');

      return {
        _id: candidate._id,
        name: candidate.userId?.name || 'Unknown',
        email: candidate.userId?.email || 'Unknown',
        jobTitle: candidate.jobTitle,
        location: candidate.location,
        skills: candidate.skills,
        status: application?.status || 'new',
        notes: application?.notes || ''
      };
    })
  );

  res.json({
    success: true,
    data: candidatesWithStatus
  });
};

const removeSavedCandidate = async (req, res) => {
  const { userId } = req.user;
  const { candidateId } = req.params;

  let employer = await Employer.findOne({ userId });

  // If employer profile doesn't exist, create one
  if (!employer) {
    // Get user info for default company name
    const user = await User.findById(userId);
    employer = await Employer.create({
      userId,
      companyName: user?.name ? `${user.name}'s Company` : 'My Company',
      savedCandidates: []
    });
  } else {
    // Remove the candidate from saved list
    employer = await Employer.findOneAndUpdate(
      { userId },
      { $pull: { savedCandidates: candidateId } },
      { new: true }
    );
  }

  res.json({ success: true });
};

const saveCandidate = async (req, res) => {
  const { userId } = req.user;
  const { candidateId } = req.params;

  let employer = await Employer.findOne({ userId });

  // If employer profile doesn't exist, create one
  if (!employer) {
    // Get user info for default company name
    const user = await User.findById(userId);
    employer = await Employer.create({
      userId,
      companyName: user?.name ? `${user.name}'s Company` : 'My Company',
      savedCandidates: [candidateId]
    });
  } else {
    // Add candidate to saved list if not already saved
    employer = await Employer.findOneAndUpdate(
      { userId },
      { $addToSet: { savedCandidates: candidateId } },
      { new: true }
    );
  }

  res.json({ success: true });
};

const updateCandidateStatus = async (req, res) => {
  const { userId } = req.user;
  const { candidateId } = req.params;
  const { status } = req.body;

  const application = await Application.findOneAndUpdate(
    { jobseeker: candidateId, employer: userId },
    { status },
    { new: true, upsert: true }
  );

  res.json({ success: true, data: application });
};

const updateCandidateNotes = async (req, res) => {
  const { userId } = req.user;
  const { candidateId } = req.params;
  const { notes } = req.body;

  const application = await Application.findOneAndUpdate(
    { jobseeker: candidateId, employer: userId },
    { notes },
    { new: true, upsert: true }
  );

  res.json({ success: true, data: application });
};

// Saved Jobs functions for jobseekers
const getSavedJobs = async (req, res) => {
  const { userId } = req.user;

  // Find the jobseeker profile for this user
  let jobseeker = await Jobseeker.findOne({ userId }).populate('savedJobs');

  // If jobseeker profile doesn't exist, create one
  if (!jobseeker) {
    jobseeker = await Jobseeker.create({
      userId,
      savedJobs: []
    });
  }

  res.json({
    success: true,
    data: jobseeker.savedJobs || []
  });
};

const saveJob = async (req, res) => {
  const { userId } = req.user;
  const { jobId } = req.params;
  
  // Check if job exists
  const job = await Job.findById(jobId);
  if (!job) {
    throw new NotFoundError('Job not found');
  }
  
  // Add job to jobseeker's saved jobs if not already saved
  let jobseeker = await Jobseeker.findOne({ userId });

  // If jobseeker profile doesn't exist, create one
  if (!jobseeker) {
    jobseeker = await Jobseeker.create({
      userId,
      savedJobs: [jobId]
    });
  } else {
    jobseeker = await Jobseeker.findOneAndUpdate(
      { userId },
      { $addToSet: { savedJobs: jobId } },
      { new: true }
    );
  }
  
  res.json({
    success: true,
    data: job
  });
};

const unsaveJob = async (req, res) => {
  const { userId } = req.user;
  const { jobId } = req.params;

  let jobseeker = await Jobseeker.findOne({ userId });

  // If jobseeker profile doesn't exist, create one (though this is unlikely for unsave)
  if (!jobseeker) {
    jobseeker = await Jobseeker.create({
      userId,
      savedJobs: []
    });
  } else {
    // Remove job from saved list
    jobseeker = await Jobseeker.findOneAndUpdate(
      { userId },
      { $pull: { savedJobs: jobId } },
      { new: true }
    );
  }

  res.json({ success: true });
};

// Profile functions
const updateProfile = async (req, res) => {
  const { userId } = req.user;
  const updateData = req.body;
  
  // Remove fields that shouldn't be updated directly
  delete updateData.password;
  delete updateData.role;
  delete updateData.email;
  
  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: user
  });
};

// Resume functions
const saveResume = async (req, res) => {
  const { userId } = req.user;
  const resumeData = req.body;
  
  const user = await User.findByIdAndUpdate(
    userId,
    { resume: resumeData },
    { new: true }
  );
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: user.resume
  });
};

const getResume = async (req, res) => {
  const { userId } = req.user;
  
  const user = await User.findById(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: user.resume || {}
  });
};

// Notification functions (mock implementations)
const getNotifications = async (req, res) => {
  // Mock notifications data
  const notifications = [
    {
      _id: '1',
      type: 'application',
      title: 'Application Status Update',
      message: 'Your application for Frontend Developer at TechCorp has been reviewed',
      createdAt: new Date(),
      read: false,
      priority: 'high'
    },
    {
      _id: '2',
      type: 'interview',
      title: 'Interview Reminder',
      message: 'You have an interview tomorrow at 2:00 PM with Design Studio',
      createdAt: new Date(),
      read: false,
      priority: 'urgent'
    }
  ];
  
  res.json({
    success: true,
    data: notifications
  });
};

const markNotificationAsRead = async (req, res) => {
  // const { id } = req.params; // Commented out unused parameter

  // In a real implementation, you would update the notification in the database
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
};

const deleteNotification = async (req, res) => {
  // const { id } = req.params; // Commented out unused parameter

  // In a real implementation, you would delete the notification from the database
  res.json({
    success: true,
    message: 'Notification deleted'
  });
};

module.exports = {
  getSavedCandidates,
  saveCandidate,
  removeSavedCandidate,
  updateCandidateStatus,
  updateCandidateNotes,
  getSavedJobs,
  saveJob,
  unsaveJob,
  updateProfile,
  saveResume,
  getResume,
  getNotifications,
  markNotificationAsRead,
  deleteNotification
};
