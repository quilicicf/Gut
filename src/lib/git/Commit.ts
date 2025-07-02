export interface Commit {
  sha: string,
  subject: string,
  body: string,
  author: string,
  relativeDate: string,
  branches: string[]
}
