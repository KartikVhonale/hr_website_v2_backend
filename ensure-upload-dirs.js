const fs = require('fs');
const path = require('path');

// Ensure upload directories exist
const uploadDirs = [
    'uploads',
    'uploads/temp'
];

uploadDirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Created directory: ${dirPath}`);
    } else {
        console.log(`Directory already exists: ${dirPath}`);
    }
});

console.log('Upload directories ensured!');
