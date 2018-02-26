const _ = require('lodash');

const path = require('path');

const execution = require('../utils/execution');
const git = require('../utils/git');

const NAME = path.parse(__filename).name;
const ALIASES = [ NAME.charAt(0) ];
const IDENTIFIERS = _.concat(NAME, ALIASES);
const DESCRIPTION = 'Adds all changes in the repository';

const pileCommand = () => {
  git.moveUpTop();
  const output = execution.execute([
    'git add . -A',
    'git -c color.status=always status -sb'
  ]);

  _(output.split('\n'))
    .drop()
    .filter((line) => line)
    .each((line) => execution.print(line));
};

module.exports = {
  NAME,
  ALIASES,
  IDENTIFIERS,
  DESCRIPTION,

  builder: _.identity,
  command: pileCommand
};
