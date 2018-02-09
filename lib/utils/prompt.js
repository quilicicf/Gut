const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

module.exports = (() => {
  /* eslint-disable object-curly-newline */
  const singleQuestion = async ({ message, validator = () => true, type = 'input', defaultValue }) => {
    const answers = await prompt({
      message,
      validate: validator,
      type,
      name: 'result',
      default: defaultValue
    });
    return answers.result;
  };

  const yesNoPrompt = async ({ message, defaultValue = true }) => {
    const question = {
      type: 'confirm',
      message,
      name: 'confirmation',
      default: defaultValue
    };
    const answers = await prompt(question);
    return answers.confirmation;
  };

  const chooseFromList = async (message, choices) => {
    const question = {
      type: 'list',
      name: 'result',
      message: message,
      choices: choices
    };
    const answers = await prompt([ question ]);
    return answers.result;
  };

  return {
    yesNoPrompt,
    singleQuestion,
    chooseFromList
  };
})();
