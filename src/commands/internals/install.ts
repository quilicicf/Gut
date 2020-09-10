import history from '../simple/history.ts';

const { install: installHistory } = history;

export default {
  command: 'install',
  aliases: [ 'i' ],
  describe: 'Installs gut',
  builder: () => {},
  handler: async () => {
    await installHistory();
  },
};
