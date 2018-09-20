const fs = require('fs');
const path = require('path');
const { fork } = require('child_process');
const {
  NAME,
  ARG_OWNER,
  ARG_REPOSITORY,
  ARG_SERVER,
} = require('../../lib/commands/git/replicate');

const PATH_TO_INDEX = path.resolve(__dirname, '..', '..', 'index.js');
const PATH_TO_GUT_TESTS = path.resolve(__dirname, '..', 'repositories', 'github', 'quilicicf', 'Gut-tests');

describe('Replicate', () => {
  test('It should replicate Gut-tests', () => {
    const args = [ NAME, `--${ARG_SERVER.name}`, 'github', `--${ARG_OWNER.name}`, 'quilicicf', `--${ARG_REPOSITORY.name}`, 'Gut-tests' ];
    const childProcess = fork(PATH_TO_INDEX, args, { stdio: 'ignore' });

    return new Promise((resolve, reject) => {
      childProcess.on('exit', (code) => {
        if (code !== 0) {
          return reject(Error(`Replicate failed with code ${code}`));
        }

        try {
          fs.statSync(PATH_TO_GUT_TESTS);
          return resolve();
        } catch (error) {
          throw new Error(`There was an issue while cloning, ${PATH_TO_GUT_TESTS} does not exist.`);
        }
      });
    });
  });
});
