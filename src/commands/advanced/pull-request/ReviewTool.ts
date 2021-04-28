export interface PullRequest {
  url: string,
  number: number,
}

export interface PullRequestCreation {
  originOwner: string,
  repositoryOwner: string,
  repositoryName: string,
  title: string,
  currentBranchName: string,
  baseBranchName: string,
  description?: string,
  assignee?: string,
}

export interface ReviewTool {
  retrievePullRequestTemplate: () => Promise<string>;
  createPullRequest: (pullRequestCreation: PullRequestCreation, token: string) => Promise<PullRequest>;
}
