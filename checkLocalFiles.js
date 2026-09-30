const fs = require('fs');
const path = require('path');

const uploadFiles = fs.readdirSync(path.join(__dirname, 'uploads'));

const checkFiles = [
  "1790618464067-1000096152.png",
  "1790303311809-Screenshot_20260925_064352_Gallery.jpg",
  "1789797949407-33208.jpg",
  "1789015749948-140902.jpg",
  "1788988772142-1000423178.jpg",
  "1788972276106-1000423178.jpg",
  "1788547508329-IMG-20260824-WA0009.jpg",
  "1790710853112-1000675360 (1).jpg",
  "1786888963255-1000101316.jpg",
  "1786432466299-1000271978.jpg"
];

console.log("Total local uploads files:", uploadFiles.length);
checkFiles.forEach(f => {
  const exists = fs.existsSync(path.join(__dirname, 'uploads', f));
  console.log(`${f}: ${exists ? 'EXISTS LOCALLY' : 'NOT IN LOCAL UPLOADS'}`);
});
