const _ = require('lodash');

const path = require('path');

const execution = require('../../utils/execution');
const git = require('../../utils/git');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Adds all changes in the repository';

const pileArgs = (yargs) => yargs.usage(`usage: gut ${command} [options]`);

const pileHandler = () => {
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
  command,
  aliases,
  describe,
  builder: pileArgs,
  handler: pileHandler
};
