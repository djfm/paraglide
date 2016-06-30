const fs = require('fs');
const { join, basename } = require('path');

const exampleFoldersPath = join(__dirname, '..', 'examples');

const examples = new Map();

fs.readdirSync(exampleFoldersPath).forEach(
  folderName => {
    const domains = new Map();
    examples.set(folderName, domains);
    const folderPath = join(exampleFoldersPath, folderName);
    fs.readdirSync(folderPath).forEach(
      fileName => {
        if (/\.js$/.exec(fileName)) {
          /* eslint-disable global-require */
          const expected = require(join(folderPath, fileName));
          /* eslint-enable global-require */
          const domain = basename(fileName, '.js');
          const inputFileName = `${domain}.pgl`;
          const input = fs.readFileSync(join(folderPath, inputFileName)).toString();
          domains.set(domain, {
            expected,
            input,
          });
        }
      }
    );
  }
);

module.exports = {
  examples,
};
