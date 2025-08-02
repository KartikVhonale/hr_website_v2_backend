const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a job title'],
    trim: true,
    maxlength: [100, 'Job title can not be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [1000, 'Description can not be more than 1000 characters']
  },
  ctc: {
    type: String,
    required: [true, 'Please add a CTC']
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
    required: [true, 'Please specify the job type']
  },
  experienceLevel: {
    type: String,
    enum: ['Entry-level', 'Mid-level', 'Senior-level', 'Lead'],
    required: [true, 'Please specify the experience level']
  },
  skills: {
    type: [String],
    required: true,
    validate: [val => val.length > 0, 'Please add at least one skill']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  company: {
    type: String,
    required: [true, 'Please add a company']
  },
  status: {
    type: String,
    enum: ['approved', 'pending'],
    default: 'pending'
  },
  employer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Job', JobSchema);
