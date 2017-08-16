module.exports = (() => {
  const fs = require('fs');
  const colors = require('colors');

  return {
    init: gutOptionsPath => {
      // TODO: prompt user!
      const gutOptions = {
        username: `quilicicf`,
        repositoriesPath: `/home/cyp/Restlet/forge`,
        preferredGitServer: `github`
      };
      fs.writeFileSync(gutOptionsPath, JSON.stringify(gutOptions, null, 2));
      return gutOptions;
    }
  };
})();
