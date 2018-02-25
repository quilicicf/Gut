const _ = require('lodash');

const execution = require('../utils/execution');
const git = require('../utils/git');

module.exports = {
  pileCommand: () => {
    git.moveUpTop();
    const output = execution.execute([
      'git add . -A',
      'git -c color.status=always status -sb'
    ]);

    _(output.split('\n'))
      .drop()
      .filter((line) => line)
      .each((line) => execution.print(line));
  }
};
