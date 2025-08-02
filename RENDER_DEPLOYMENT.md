# Render Deployment Guide

## 🚀 Deploying HR Website Backend to Render

This guide will help you deploy your HR website backend to Render with proper environment variable configuration.

## 📋 Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: Gather all required environment variables

## 🔧 Required Environment Variables

Set these environment variables in your Render service dashboard:

### **Essential Variables**
```
NODE_ENV=production
PORT=3000
```

### **Database Configuration**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hr_website?retryWrites=true&w=majority
```

### **JWT Configuration**
```
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=7d
```

### **Cloudinary Configuration** (for file uploads)
```
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

### **Email Configuration** (optional)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@yourcompany.com
```

### **Security Configuration** (optional)
```
CORS_ORIGIN=https://your-frontend-domain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛠️ Render Service Configuration

### **1. Create New Web Service**
1. Go to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your backend code

### **2. Service Configuration**
```
Name: hr-website-backend
Environment: Node
Region: Choose closest to your users
Branch: main (or your main branch)
Root Directory: backend (if backend is in a subdirectory)
```

### **3. Build & Deploy Settings**
```
Build Command: npm install
Start Command: npm start
```

### **4. Environment Variables**
1. Go to "Environment" tab in your service
2. Add all the environment variables listed above
3. Click "Save Changes"

## 📁 Project Structure

Make sure your backend directory has these files:

```
backend/
├── package.json          # Must have "start" script
├── server.js             # Main server file
├── config/
│   ├── db.js             # Database connection
│   └── env-validation.js # Environment validation
├── models/               # Database models
├── routes/               # API routes
├── controllers/          # Route controllers
└── middleware/           # Custom middleware
```

## 📦 Package.json Requirements

Ensure your `package.json` has the correct start script:

```json
{
  "name": "hr-website-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mongoose": "^7.0.0",
    "dotenv": "^16.0.0",
    // ... other dependencies
  }
}
```

## 🔍 Environment Variable Setup Guide

### **1. MongoDB Atlas Setup**
1. Create account at [mongodb.com](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for Render)
5. Get connection string and add to `MONGODB_URI`

### **2. Cloudinary Setup**
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Add to respective environment variables

### **3. JWT Secret Generation**
Generate a secure JWT secret (at least 32 characters):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 🚀 Deployment Steps

### **1. Push Code to GitHub**
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### **2. Deploy on Render**
1. Create new web service
2. Connect GitHub repository
3. Configure build settings
4. Add environment variables
5. Click "Create Web Service"

### **3. Monitor Deployment**
1. Watch the build logs
2. Check for any errors
3. Test the deployed API endpoints

## 🧪 Testing Deployment

### **1. Health Check**
Test your deployed API:
```
GET https://your-service-name.onrender.com/
```

Should return:
```json
{
  "message": "TalentFlow API Server",
  "version": "1.0.0",
  "status": "running"
}
```

### **2. API Test**
```
GET https://your-service-name.onrender.com/api/test
```

### **3. Database Connection**
Check logs for successful MongoDB connection.

## 🔧 Troubleshooting

### **Common Issues**

#### **1. Build Fails**
- Check `package.json` has correct dependencies
- Ensure `start` script is defined
- Check Node.js version compatibility

#### **2. Environment Variables Missing**
- Verify all required variables are set in Render dashboard
- Check variable names match exactly (case-sensitive)
- Ensure no extra spaces in values

#### **3. Database Connection Fails**
- Verify MongoDB URI is correct
- Check MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Ensure database user has correct permissions

#### **4. Service Won't Start**
- Check start command is correct
- Review deployment logs for errors
- Ensure PORT environment variable is set

### **Debug Commands**
Add these to your server.js for debugging:
```javascript
console.log('🌍 Environment:', process.env.NODE_ENV);
console.log('🚀 Port:', process.env.PORT);
console.log('🔗 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Missing');
console.log('🔑 JWT Secret:', process.env.JWT_SECRET ? 'Set' : 'Missing');
```

## 📱 Frontend Configuration

Update your frontend API configuration to use the Render URL:

```javascript
// Frontend/src/api/config.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-service-name.onrender.com';
```

## 🎉 Success!

Once deployed successfully:
1. ✅ Backend running on Render
2. ✅ Database connected
3. ✅ Environment variables configured
4. ✅ API endpoints accessible
5. ✅ Ready for frontend integration

## 📞 Support

If you encounter issues:
1. Check Render deployment logs
2. Review environment variable configuration
3. Test API endpoints individually
4. Check database connection status

Your HR website backend should now be successfully deployed on Render! 🚀
