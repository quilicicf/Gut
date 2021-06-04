self.onmessage = ({ data: { repositoryPath } }: MessageEvent) => {
  self.postMessage({ message: repositoryPath });
};
