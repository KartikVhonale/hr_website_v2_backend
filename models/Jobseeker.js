const mongoose = require('mongoose');

const JobseekerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  phone: {
    type: String
  },
  location: {
    type: String
  },
  jobTitle: {
    type: String
  },
  summary: {
    type: String
  },
  skills: {
    type: [String],
    default: []
  },
  experience: [{
    title: String,
    company: String,
    location: String,
    startDate: Date,
    endDate: Date,
    current: {
      type: Boolean,
      default: false
    },
    description: String
  }],
  education: [{
    degree: String,
    school: String,
    location: String,
    startDate: Date,
    endDate: Date,
    gpa: String
  }],
  certifications: [{
    name: String,
    issuer: String,
    date: Date,
    credentialId: String
  }],
  socialLinks: {
    linkedin: String,
    github: String,
    portfolio: String
  },
  resume: {
    url: String,
    public_id: String,
    original_name: String,
    uploaded_at: Date
  },
  savedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  profileCompletion: {
    type: Number,
    default: 0
  },
  isProfilePublic: {
    type: Boolean,
    default: true
  },
  preferences: {
    jobTypes: [String],
    salaryRange: {
      min: Number,
      max: Number
    },
    preferredLocations: [String],
    remoteWork: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Calculate profile completion percentage
JobseekerSchema.methods.calculateProfileCompletion = function() {
  let completed = 0;
  const total = 8;
  
  if (this.phone) completed++;
  if (this.location) completed++;
  if (this.jobTitle) completed++;
  if (this.summary) completed++;
  if (this.skills && this.skills.length > 0) completed++;
  if (this.experience && this.experience.length > 0) completed++;
  if (this.education && this.education.length > 0) completed++;
  if (this.socialLinks && (this.socialLinks.linkedin || this.socialLinks.github || this.socialLinks.portfolio)) completed++;
  
  return Math.round((completed / total) * 100);
};

// Update profile completion before saving
JobseekerSchema.pre('save', function(next) {
  this.profileCompletion = this.calculateProfileCompletion();
  next();
});

module.exports = mongoose.model('Jobseeker', JobseekerSchema);
