import { exec, execSequence, OutputMode } from 'https://deno.land/x/exec/mod.ts';

// const _exec = async (command: string, outputMode: OutputMode): Promise<string> => {
//   switch (outputMode) {
//     case OutputMode.None:
//       await exec(command, { output: OutputMode.None });
//       return '';
//     case OutputMode.StdOut:
//       const { output: stdoutPut } = await exec(command, { output: OutputMode.StdOut });
//       return stdoutPut;
//     case OutputMode.Tee:
//       const { output: teeOutput } = await exec(command, { output: OutputMode.Tee });
//       return teeOutput;
//     case OutputMode.Capture:
//       const { output: captureOutput } = await exec(command, { output: OutputMode.Capture });
//       return captureOutput;
//     default:
//       throw Error(`Unknown output mode ${outputMode}`);
//   }
// };

export { exec, execSequence, OutputMode };
