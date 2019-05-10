const _ = require('lodash');
const { readFile } = require('fs');

module.exports = async (filePath, transformer = _.identity) => new Promise((resolve, reject) => {
  readFile(filePath, 'utf8', (error, data) => {
    if (error) { return reject(error); }
    return resolve(transformer(data));
  });
});
