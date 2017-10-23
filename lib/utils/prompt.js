// TODO: get rid of promptly, no need to have to prompt dependencies
const promptly = require('promptly');
const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

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

  const chooseFromList = (message, choices) => {
    const question = {
      type: 'list',
      name: 'result',
      message: message,
      choices: choices
    };
    return prompt([ question ])
      .then(answers => answers.result);
  };

  return {
    yesNoPrompt,
    yesNoPromisifiedPrompt,
    promisifiedPrompt,

    chooseFromList
  };
})();
