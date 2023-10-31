import { editText } from './src/lib/editText.ts';

const result = await editText({
  fileType:'markdown',
  startTemplate: 'Toto ',
  startIndex: {
    line: 0,
    column: 6,
  }
});

console.log(result);
