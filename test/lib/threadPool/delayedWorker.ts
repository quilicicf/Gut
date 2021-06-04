export type Payload<R> = {
  delay: number;
  result?: R;
  errorMessage?: string;
}

self.onmessage = <R> ({ data: payload }: MessageEvent<Payload<R>>) => {
  setTimeout(() => {
    if (payload.result) {
      self.postMessage(payload.result);
    } else {
      throw Error(payload.errorMessage);
    }
  }, payload.delay);
};
