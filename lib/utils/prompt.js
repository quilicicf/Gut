const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

module.exports = (() => {
  const singleQuestion = ({ message, validator = () => true, type = 'input' }) => {
    return prompt({
      message,
      validate: validator,
      type,
      name: 'result'
    }).then((answers) => answers.result);
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
    singleQuestion,
    chooseFromList
  };
})();
