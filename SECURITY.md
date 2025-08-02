# Security Implementation Guide

## Overview
This document outlines the comprehensive security measures implemented in the HR Website backend to protect against common web vulnerabilities and attacks.

## Security Features Implemented

### 1. Input Validation & Sanitization

#### Express Validator Integration
- **Location**: `middleware/validation-middleware.js`
- **Features**:
  - Comprehensive validation rules for all endpoints
  - Custom validation for MongoDB ObjectIds
  - Email format validation with normalization
  - Password strength requirements (8+ chars, uppercase, lowercase, number, special char)
  - File type validation for uploads
  - Array validation for skills and categories

#### XSS Protection
- **Implementation**: XSS sanitization middleware
- **Coverage**: All request body and query parameters
- **Library**: `xss` package for HTML sanitization

#### NoSQL Injection Prevention
- **Library**: `express-mongo-sanitize`
- **Function**: Removes prohibited characters from user input
- **Logging**: Logs potential injection attempts

### 2. Rate Limiting

#### Multiple Rate Limiting Strategies
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per hour per IP
- **File Uploads**: 10 uploads per 15 minutes per IP
- **Job Creation**: 20 job posts per hour per IP

#### Features
- IP-based tracking
- Configurable time windows
- Custom error messages
- Skip successful requests for auth endpoints

### 3. Security Headers

#### Helmet.js Implementation
- **Content Security Policy**: Restricts resource loading
- **HSTS**: Forces HTTPS connections
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Referrer Policy**: Controls referrer information

### 4. Authentication & Authorization

#### JWT Security
- **Token Validation**: Comprehensive JWT verification
- **Error Handling**: Specific error messages for different JWT issues
- **Token Structure**: Validates required fields (userId, email, role)
- **Environment Check**: Validates JWT_SECRET configuration

#### Role-Based Access Control
- **Roles**: Admin, Employer, Jobseeker
- **Middleware**: `requireAdmin`, `requireEmployer`, `requireJobseeker`
- **Flexible Access**: Admins can access employer/jobseeker endpoints

### 5. File Upload Security

#### PDF-Only Resume Uploads
- **MIME Type Validation**: Only `application/pdf` accepted
- **File Size Limits**: 5MB maximum for resumes
- **Cloudinary Integration**: Secure cloud storage
- **Rate Limiting**: Upload-specific rate limits

#### Error Handling
- **File Size Errors**: Custom messages for oversized files
- **File Type Errors**: Clear rejection messages
- **Upload Limits**: Prevents multiple file uploads

### 6. Error Handling & Logging

#### Comprehensive Error Management
- **Global Handler**: Catches all unhandled errors
- **Environment-Specific**: Different responses for dev/prod
- **Security Logging**: Logs suspicious activities
- **Database Errors**: Handles MongoDB-specific errors

#### Security Monitoring
- **Suspicious Pattern Detection**: Monitors for SQL injection, XSS attempts
- **IP Logging**: Tracks source of security violations
- **User Agent Tracking**: Logs browser information for analysis

### 7. CORS Security

#### Strict Origin Control
- **Allowed Origins**: Whitelist of trusted domains
- **Credentials**: Supports authenticated requests
- **Methods**: Limited to necessary HTTP methods
- **Headers**: Restricted header allowlist

#### Production Security
- **Origin Validation**: Warns about suspicious origins
- **Environment-Specific**: Different rules for dev/prod

### 8. Request Security

#### Parameter Pollution Prevention
- **Library**: `hpp` (HTTP Parameter Pollution)
- **Whitelist**: Allows arrays for specific parameters (skills, categories)

#### Request Size Limiting
- **JSON Limit**: 10MB maximum
- **URL Encoded**: 10MB maximum
- **Parameter Limit**: 20 parameters maximum

### 9. Environment Security

#### Configuration Validation
- **Required Variables**: Validates all necessary env vars
- **JWT Secret Strength**: Minimum 32 characters
- **MongoDB URI**: Format validation
- **Production Checks**: Additional security in production

## Security Best Practices

### 1. Password Security
```javascript
// Password requirements enforced:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
```

### 2. Database Security
```javascript
// MongoDB injection prevention:
- Input sanitization
- Parameterized queries
- Schema validation
```

### 3. API Security
```javascript
// Rate limiting configuration:
- Authentication: 5 attempts/15min
- General API: 100 requests/15min
- File uploads: 10 uploads/15min
```

### 4. File Upload Security
```javascript
// Upload restrictions:
- PDF files only for resumes
- 5MB size limit
- Cloudinary secure storage
- Rate limiting
```

## Monitoring & Alerts

### Security Logging
- All security violations are logged with:
  - IP address
  - Timestamp
  - Request details
  - User agent
  - Attempted payload

### Recommended Monitoring
1. **Rate Limit Violations**: Monitor for repeated violations
2. **Authentication Failures**: Track failed login attempts
3. **File Upload Abuse**: Monitor upload patterns
4. **Suspicious Patterns**: Watch for injection attempts

## Production Deployment Security

### Environment Variables
```bash
# Required for production:
JWT_SECRET=<strong-secret-32+chars>
MONGODB_URI=<secure-mongodb-connection>
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
FRONTEND_URL=<your-frontend-domain>
NODE_ENV=production
```

### Additional Production Security
1. **HTTPS Only**: Ensure SSL/TLS certificates
2. **Firewall Rules**: Restrict database access
3. **Regular Updates**: Keep dependencies updated
4. **Security Audits**: Run `npm audit` regularly
5. **Backup Strategy**: Secure database backups

## Testing Security

### Manual Testing
1. **Rate Limiting**: Test with rapid requests
2. **Input Validation**: Try malicious payloads
3. **File Uploads**: Test with non-PDF files
4. **Authentication**: Test with invalid tokens

### Automated Testing
```bash
# Run security audit
npm audit

# Check for vulnerabilities
npm audit fix
```

## Incident Response

### Security Violation Response
1. **Log Analysis**: Review security logs
2. **IP Blocking**: Consider blocking malicious IPs
3. **Pattern Analysis**: Look for attack patterns
4. **System Updates**: Apply security patches

### Emergency Procedures
1. **Immediate**: Block suspicious IPs
2. **Short-term**: Increase rate limiting
3. **Long-term**: Review and update security measures

## Compliance & Standards

### Security Standards Followed
- **OWASP Top 10**: Protection against common vulnerabilities
- **JWT Best Practices**: Secure token implementation
- **File Upload Security**: Safe file handling
- **Input Validation**: Comprehensive sanitization

### Regular Security Tasks
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Annual penetration testing
- [ ] Continuous monitoring review
