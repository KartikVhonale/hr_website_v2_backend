const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema({
  jobseeker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  application: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // Duration in minutes
    default: 60
  },
  type: {
    type: String,
    enum: ['phone', 'video', 'in-person', 'technical', 'hr'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no-show'],
    default: 'scheduled'
  },
  meetingLink: {
    type: String // For video interviews
  },
  location: {
    type: String // For in-person interviews
  },
  notes: {
    type: String
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    strengths: [String],
    improvements: [String],
    recommendation: {
      type: String,
      enum: ['hire', 'reject', 'second_round', 'pending']
    }
  },
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'notification']
    },
    sentAt: Date,
    scheduledFor: Date
  }],
  rescheduleHistory: [{
    originalDate: Date,
    newDate: Date,
    reason: String,
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rescheduledAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Index for efficient queries
InterviewSchema.index({ jobseeker: 1, scheduledAt: 1 });
InterviewSchema.index({ employer: 1, scheduledAt: 1 });
InterviewSchema.index({ job: 1 });
InterviewSchema.index({ status: 1 });

// Virtual for checking if interview is upcoming
InterviewSchema.virtual('isUpcoming').get(function() {
  return this.scheduledAt > new Date() && this.status === 'scheduled';
});

// Virtual for checking if interview is overdue
InterviewSchema.virtual('isOverdue').get(function() {
  return this.scheduledAt < new Date() && this.status === 'scheduled';
});

// Method to reschedule interview
InterviewSchema.methods.reschedule = function(newDate, reason, rescheduledBy) {
  this.rescheduleHistory.push({
    originalDate: this.scheduledAt,
    newDate: newDate,
    reason: reason,
    rescheduledBy: rescheduledBy
  });
  this.scheduledAt = newDate;
  this.status = 'rescheduled';
  return this.save();
};

// Method to complete interview with feedback
InterviewSchema.methods.complete = function(feedback) {
  this.status = 'completed';
  if (feedback) {
    this.feedback = { ...this.feedback, ...feedback };
  }
  return this.save();
};

// Static method to get upcoming interviews for a jobseeker
InterviewSchema.statics.getUpcomingForJobseeker = function(jobseekerId) {
  return this.find({
    jobseeker: jobseekerId,
    scheduledAt: { $gte: new Date() },
    status: 'scheduled'
  })
  .populate('job', 'title company location')
  .populate('employer', 'name email')
  .sort({ scheduledAt: 1 });
};

// Static method to get interviews for an employer
InterviewSchema.statics.getForEmployer = function(employerId, filters = {}) {
  const query = { employer: employerId, ...filters };
  return this.find(query)
    .populate('jobseeker', 'name email')
    .populate('job', 'title')
    .sort({ scheduledAt: -1 });
};

module.exports = mongoose.model('Interview', InterviewSchema);
