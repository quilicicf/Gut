const _ = require('lodash');
const { writeFile } = require('fs');

module.exports = (filePath, data, transformer = _.identity) => new Promise((resolve, reject) => {
  writeFile(filePath, transformer(data), 'utf8', (error) => {
    if (error) { return reject(error); }
    return resolve();
  });
});
