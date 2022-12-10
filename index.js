// open file
const fs = require('fs');
const path = require('path');
// const filePath = path.join(__dirname, '../cea-desktop/client');

// open directory
const clientRootDir = '../cea-desktop/client/src';

function processFile(dirPath, file) {
  const filePath = path.join(dirPath, file.name);
  // console.log('filePath', filePath);

  // get file extension
  const ext = path.extname(filePath);
  if (ext === '.js' || ext === '.jsx') {
    // read file into string
    const content = fs.readFileSync(filePath);

    // import { TextField } from '@mui/material';

    // find regex match
    // const regex = /^import\s+\{(.*)\}\s+from\s+\'\@mui\/material\';/gm;

    // Global, multiline, single line (dot matches new line)
    const regex = /^import\s+\{([^{]*)\}\s+from\s+\'\@mui\/material\';$/gms;

    const match = regex.exec(content);
    if (match) {
      // console.log('match', match);
      const importMatch = match[0];
      const importList = match[1];

      console.log('importMatch ', importMatch);
      // console.log('importList', importList);
    }
  }
}

function traverseDir(dir, level = 0) {
  let dirent = dir.readSync();
  while (dirent) {
    // console.log('dirent', dirent);
    // const indent = ' '.repeat(level * 2);
    const filePath = path.join(dir.path, dirent.name);

    // Check if the entry is a file or a directory
    if (dirent.isFile()) {
      // console.log('F:', indent, filePath);
      processFile(dir.path, dirent);
    } else if (dirent.isDirectory()) {
      // console.log("D:", indent, filePath);
      const subDir = fs.opendirSync(filePath);
      traverseDir(subDir, level + 1);
      subDir.closeSync();
    }

    dirent = dir.readSync();
  }
}

fs.opendir(clientRootDir, async (err, dir) => {
  console.log('open directory success');
  if (err) console.log('Error:', err);
  else {
    // Print the pathname of the directory
    console.log('Path of the directory:', dir.path);

    // Read the directory
    console.log('Reading the directory');

    traverseDir(dir, clientRootDir);

    // Close the directory
    console.log('Closing the directory');
    dir.closeSync();
  }
});
