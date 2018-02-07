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

  const simpleInputPrompt = (message) => {
    const question = {
      type: 'input',
      message,
      name: 'result'
    };

    return prompt(question)
      .then((answers) => answers.result);
  };

  const yesNoPrompt = ({ message, defaultValue = true }) => {
    const question = {
      type: 'confirm',
      message,
      name: 'confirmation',
      default: defaultValue
    };
    return prompt(question)
      .then((answers) => answers.confirmation);
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
    simpleInputPrompt,

    yesNoPromisifiedPrompt,
    promisifiedPrompt,

    chooseFromList
  };
})();
