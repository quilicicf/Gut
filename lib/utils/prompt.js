const promptly = require('promptly');

module.exports = (() => {
  const promisifiedPrompt = (message, options) => {
    return new Promise((resolve, reject) => {
      promptly.prompt(message, options || {}, (error, value) => {
        return error
          ? reject(error)
          : resolve(value);
      });
    });
  };

  const yesNoPromisifiedPrompt = (message) => {
    const options = {
      default: 'n',
      validator: choice => choice === 'y'
    };

    return new Promise((resolve, reject) => {
      promptly.prompt(`${message} (y/n)`, options, (error, value) => {
        return error
          ? reject(error)
          : resolve(value);
      });
    });
  };

  const wait = (message) => {
    return new Promise((resolve, reject) => {
      // TODO: allow empty
      promptly.prompt(`${message} type enter when you  are ready`, { default: 'toto' }, (error, value) => {
        return error
          ? reject(error)
          : resolve(value);
      });
    });
  };

  // TODO: get rid of that one
  const yesNoPrompt = (message, callback) => {
    const options = {
      default: 'n',
      validator: choice => choice === 'y'
    };
    promptly.prompt(`${message} (y/n)`, options, (error, value) => {
      if (error) {
        throw error;
      }

      callback(value);
    });
  };

  return {
    yesNoPrompt,
    yesNoPromisifiedPrompt,
    promisifiedPrompt,
    wait
  };
})();
