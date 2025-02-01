const fetch = require('node-fetch'); // Import node-fetch
const fs = require('fs');
const FormData = require('form-data');

// Replace 'YOUR_AUTH_TOKEN' with the actual token
const authToken = 'YOUR_AUTH_TOKEN';
const videoDirectory = './videos'; // Directory on your local machine containing video files

// Function to upload a single video file
async function uploadVideo(file) {
    const filePath = `${videoDirectory}/${file}`;
    const formData = new FormData();
    formData.append('video', fs.createReadStream(filePath));

    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            body: formData
        });

        const data = await response.text();
        console.log(`Uploaded ${file}:`, data);
    } catch (error) {
        console.error(`Error uploading ${file}:`, error);
    }
}

// Function to read video files and upload them in bulk
function uploadVideos() {
    fs.readdir(videoDirectory, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        files.forEach(file => {
            uploadVideo(file);
        });
    });
}

// Start the bulk upload process
uploadVideos();
