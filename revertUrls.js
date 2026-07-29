const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'controllers');
const serverFilePath = path.join(__dirname, 'server.js');

const liveUrl = "https://api.pujapathsanskar.com";
const localUrl = "http://192.168.29.34:5000";

function replaceInFile(filePath) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(localUrl)) {
            // Replace localUrl with liveUrl
            const regex = new RegExp(localUrl.replace(/\//g, '\\/'), 'g');
            const newContent = content.replace(regex, liveUrl);
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Reverted URLs in ${filePath}`);
        }
    }
}

// Process controllers
fs.readdir(directoryPath, (err, files) => {
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    }
    files.forEach((file) => {
        if (file.endsWith('.js')) {
            const filePath = path.join(directoryPath, file);
            replaceInFile(filePath);
        }
    });
});

// Process server.js
replaceInFile(serverFilePath);
