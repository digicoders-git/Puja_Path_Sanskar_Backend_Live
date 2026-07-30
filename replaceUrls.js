const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'controllers');
const serverFilePath = path.join(__dirname, 'server.js');

const liveUrl = "https://api.pujapathsanskar.com";
const localUrl = "http://192.168.29.234:5000";

function replaceInFile(filePath) {
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(liveUrl)) {
            // Replace liveUrl with localUrl
            const regex = new RegExp(liveUrl.replace(/\//g, '\\/'), 'g');
            const newContent = content.replace(regex, localUrl);
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Replaced URLs in ${filePath}`);
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
