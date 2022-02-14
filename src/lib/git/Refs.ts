export interface RefType {
  regex: RegExp,
  detect: (ref: string) => boolean,
  extractName: (ref: string) => string,
}

export type Refs = {
  branches: string[],
  tags: string[],
}

export const REF_TYPES: { [ key: string ]: RefType } = {
  TAG: {
    regex: /^refs\/tags\/(.+)/,
    detect (ref: string) { return this.regex.test(ref); },
    extractName (ref: string) {
      const result: string | undefined = this.regex.exec(ref)?.[ 1 ];
      if (!result) {
        throw Error(`Can't extract branch name for ref ${ref}`);
      }
      return result;
    },
  },
  STASH: {
    regex: /^refs\/stash$/,
    detect (ref: string) { return this.regex.test(ref); },
    extractName (): string {
      throw Error('Can\'t extract ref name on stash ref.');
    },
  },
  HEADS: {
    regex: /^refs\/heads\/(.*)/,
    detect (ref: string) { return this.regex.test(ref); },
    extractName (ref: string) {
      const result: string | undefined = this.regex.exec(ref)?.[ 1 ];
      if (!result) {
        throw Error(`Can't extract branch name for ref ${ref}`);
      }
      return result;
    },
  },
  REMOTE: {
    regex: /^refs\/remotes\/([^/]+)\/(.*)/,
    detect (ref: string) { return this.regex.test(ref); },
    extractName (ref: string) {
      const result: string | undefined = this.regex.exec(ref)?.[ 1 ];
      if (!result) {
        throw Error(`Can't extract branch name for ref ${ref}`);
      }
      return result;
    },
  },
};
