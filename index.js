// open file
const fs = require('fs');
const { kebabCase } = require('lodash');
const path = require('path');
// const filePath = path.join(__dirname, '../cea-desktop/client');

// open directory
const clientRootDir = '../cea-desktop/client/src';

function handleMUIImports(contentBuffer) {
  // We will convert this:
  // import { TextField } from '@mui/material';
  // To this:
  // import TextField from '@mui/material/TextField';

  // find regex match
  // const regex = /^import\s+\{(.*)\}\s+from\s+\'\@mui\/material\';/gm;

  // Global, multiline, single line (dot matches new line)
  const regex = /^import\s+\{([^{]*)\}\s+from\s+\'\@mui\/material\';$/gms;

  const match = regex.exec(contentBuffer);
  if (match) {
    // console.log('match', match);
    const importMatch = match[0];
    const importList = match[1];

    // console.log('importMatch ', importMatch);
    // console.log('importList', importList);
    const importListArray = importList.split(',');

    let newImports = '';
    importListArray.forEach((item, index) => {
      const componentName = item.trim();

      // Convert to default import
      if (componentName) {
        // check some special cases
        if (
          componentName === 'useTheme' ||
          componentName === 'alpha' ||
          componentName === 'adaptV4Theme'
        ) {
          // these cannot be converted to default imports
          newImports += `import { ${componentName} } from '@mui/material';`;
        } else {
          const updatedImport = `import ${componentName} from '@mui/material/${componentName}';`;
          newImports += updatedImport;

          if (index < importListArray.length - 1) {
            // Don't add new line to last item
            newImports += '\n';
          }
        }
      }
    });

    // console.log('newImports', newImports);
    const contentString = contentBuffer.toString();
    // console.log('replacing ', importMatch, newImports);
    // console.log('contentString', contentString.includes(importMatch));
    const newContents = contentString.replace(importMatch, newImports);

    return {
      isModified: true,
      newContents,
    };
  }

  // else
  return {
    isModified: false,
  };
}

function processSharedImports(contentBuffer) {
  // We will convert this:
  // import { Helmet } from 'shared';

  // To this:
  // import Helmet from 'shared/helmet';

  // Global, multiline, single line (dot matches new line)
  const regex = /^import\s+\{([^{]*)\}\s+from\s+\'shared';$/gms;

  const match = regex.exec(contentBuffer);
  if (match) {
    // console.log('match', match);
    const importMatch = match[0];
    const importList = match[1];

    // console.log('importMatch ', importMatch);
    // console.log('importList', importList);
    const importListArray = importList.split(',');

    let newImports = '';
    importListArray.forEach((item, index) => {
      const componentName = item.trim();

      // Convert to default import
      if (componentName) {
        // check some special cases
        let updatedComponentPath = kebabCase(componentName);
        if(componentName === 'SubscriptionEndDateElement' || componentName === 'EnhancedCheckbox') {
          // these use PascalCase in the filename
          updatedComponentPath = componentName;
        } else if(componentName === 'TimeStamp') {
          // These don't actually use kebab case
          updatedComponentPath = componentName.toLocaleLowerCase();
        } else if(componentName === 'Expander') {
          // This is a special case... because reasons
          updatedComponentPath = 'expander-chevron-icon';
        }

        const updatedImport = `import ${componentName} from 'shared/${updatedComponentPath}';`;
        newImports += updatedImport;

        if (index < importListArray.length - 1) {
          // Don't add new line to last item
          newImports += '\n';
        }
      }
    });

    // console.log('newImports', newImports);
    const contentString = contentBuffer.toString();
    // console.log('replacing ', importMatch, newImports);
    // console.log('contentString', contentString.includes(importMatch));
    const newContents = contentString.replace(importMatch, newImports);

    return {
      isModified: true,
      newContents,
    };
  }

  // else
  return {
    isModified: false,
    newContents: contentBuffer,
  };
}

function processFile(dirPath, file) {
  const filePath = path.join(dirPath, file.name);
  // console.log('filePath', filePath);

  // get file extension
  const ext = path.extname(filePath);
  if (ext === '.js' || ext === '.jsx') {
    // read file into string
    let contentBuffer = fs.readFileSync(filePath);

    const muiResult = handleMUIImports(contentBuffer);

    contentBuffer = muiResult.isModified
      ? muiResult.newContents
      : contentBuffer;

    const sharedResult = processSharedImports(contentBuffer);

    // write file
    console.log('writing file', filePath);

    if (muiResult.isModified || sharedResult.isModified) {
      try {
        fs.writeFileSync(filePath, sharedResult.newContents);
      } catch (e) {
        console.log('error writing file', e);
      }
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
