const mongoose = require('mongoose');

const EmployerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required']
  },
  companyDescription: {
    type: String
  },
  industry: {
    type: String
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
  },
  website: {
    type: String
  },
  headquarters: {
    address: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contactInfo: {
    phone: String,
    email: String,
    alternateEmail: String
  },
  socialMedia: {
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  companyLogo: {
    type: String // URL to logo image
  },
  companyImages: [{
    type: String // URLs to company images
  }],
  benefits: [String],
  companyValues: [String],
  workCulture: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [{
    documentType: String,
    documentUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  jobPostingLimits: {
    totalAllowed: {
      type: Number,
      default: 5 // Free plan limit
    },
    used: {
      type: Number,
      default: 0
    }
  },
  savedCandidates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Jobseeker'
  }],
  postedJobs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  }],
  profileCompletion: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Calculate profile completion percentage
EmployerSchema.methods.calculateProfileCompletion = function() {
  let completed = 0;
  const total = 8;
  
  if (this.companyName) completed++;
  if (this.companyDescription) completed++;
  if (this.industry) completed++;
  if (this.companySize) completed++;
  if (this.website) completed++;
  if (this.headquarters && this.headquarters.city) completed++;
  if (this.contactInfo && this.contactInfo.phone) completed++;
  if (this.companyLogo) completed++;
  
  return Math.round((completed / total) * 100);
};

// Update profile completion before saving
EmployerSchema.pre('save', function(next) {
  this.profileCompletion = this.calculateProfileCompletion();
  next();
});

module.exports = mongoose.model('Employer', EmployerSchema);
