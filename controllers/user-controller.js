const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { NotFoundError } = require('../errors');

const getSavedCandidates = async (req, res) => {
  const { userId } = req.user;
  
  const user = await User.findById(userId).populate({
    path: 'savedCandidates',
    select: '-password -__v',
    populate: {
      path: 'applications',
      match: { employer: userId },
      select: 'status notes'
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user.savedCandidates.map(candidate => ({
      ...candidate.toObject(),
      status: candidate.applications[0]?.status || 'new',
      notes: candidate.applications[0]?.notes || ''
    }))
  });
};

const removeSavedCandidate = async (req, res) => {
  const { userId } = req.user;
  const { candidateId } = req.params;

  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { savedCandidates: candidateId } },
    { new: true }
  );

  if (!user) {
    throw new NotFoundError('User not found');
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
  
  const user = await User.findById(userId).populate('savedJobs');
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: user.savedJobs
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
  
  // Add job to user's saved jobs if not already saved
  const user = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { savedJobs: jobId } },
    { new: true }
  );
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  res.json({
    success: true,
    data: job
  });
};

const unsaveJob = async (req, res) => {
  const { userId } = req.user;
  const { jobId } = req.params;
  
  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { savedJobs: jobId } },
    { new: true }
  );
  
  if (!user) {
    throw new NotFoundError('User not found');
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
  const { id } = req.params;
  
  // In a real implementation, you would update the notification in the database
  res.json({
    success: true,
    message: 'Notification marked as read'
  });
};

const deleteNotification = async (req, res) => {
  const { id } = req.params;
  
  // In a real implementation, you would delete the notification from the database
  res.json({
    success: true,
    message: 'Notification deleted'
  });
};

module.exports = {
  getSavedCandidates,
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
