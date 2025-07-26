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
  salary: {
    type: String,
    required: [true, 'Please add a salary']
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
