const { prompt, registerPrompt } = require('inquirer');
registerPrompt('autocomplete', require('inquirer-autocomplete-prompt'));

const { IS_TEST_MODE } = require('./isTest');

const QUESTION_ANSWER_NAME = 'result';
const QUESTION_TYPES = {
  AUTO_COMPLETE: 'autocomplete',
  STRING: 'input',
  BOOLEAN: 'confirm',
  LIST: 'list',
};

const QUESTION_STEPS = {
  OPEN: 'OPEN',
  CLOSE: 'CLOSE',
};

const ask = async (question) => {
  if (IS_TEST_MODE) {
    process.send({
      id: question.id,
      step: QUESTION_STEPS.OPEN,
    });
  }

  const answer = await prompt({ ...question, name: QUESTION_ANSWER_NAME });
  if (IS_TEST_MODE) {
    process.send({
      id: question.id,
      step: QUESTION_STEPS.CLOSE,
    });
  }

  return answer[ QUESTION_ANSWER_NAME ];
};

module.exports = { QUESTION_TYPES, QUESTION_STEPS, ask };
