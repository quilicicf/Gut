const inquirer = require('inquirer');
const prompt = inquirer.createPromptModule();

const IS_TEST_MODE = !!process.send;

const QUESTION_TYPES = {
  STRING: 'input',
  BOOLEAN: 'confirm',
  LIST: 'list'
};

const QUESTION_STEPS = {
  OPEN: 'OPEN',
  CLOSE: 'CLOSE'
};

const QUESTION_ANSWER_NAME = 'result';

module.exports = (() => {
  const ask = async (question) => {
    if (IS_TEST_MODE) {
      process.send({
        id: question.id,
        step: QUESTION_STEPS.OPEN
      });
    }

    const answer = await prompt({ ...question, name: QUESTION_ANSWER_NAME });
    if (IS_TEST_MODE) {
      process.send({
        id: question.id,
        step: QUESTION_STEPS.CLOSE
      });
    }

    return answer[ QUESTION_ANSWER_NAME ];
  };

  return { QUESTION_TYPES, QUESTION_STEPS, ask };
})();
