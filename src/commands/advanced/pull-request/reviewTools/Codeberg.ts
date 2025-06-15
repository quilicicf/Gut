import log from '../../../../dependencies/log.ts';
import { stoyle, stoyleGlobal, theme } from '../../../../dependencies/stoyle.ts';

import { request } from '../../../../lib/request.ts';

import { PullRequest, PullRequestCreation, ReviewTool } from '../ReviewTool.ts';

const BASE_URL = 'https://codeberg.org';

const handleResponseError = async <T>(response: Response): Promise<T> => {
  const body = await response.json();
  const message = body?.message;
  const firstError = body?.errors?.[ 0 ];

  if (message && !firstError) {
    await log(Deno.stderr, stoyleGlobal`Codeberg API call failed with message: ${message}.\n`(theme.error));
    Deno.exit(1);
  }

  if (firstError?.field === 'head') {
    await log(Deno.stderr, stoyleGlobal`It looks like your branch was not pushed to upstream.\n`(theme.error));
    Deno.exit(1);
  }

  if (firstError?.message) {
    await log(Deno.stderr, stoyleGlobal`${firstError.message}\n`(theme.error));
    Deno.exit(1);
  }

  const error = JSON.stringify(body, null, 2);
  await log(
    Deno.stderr,
    stoyleGlobal`Codeberg API call failed with status ${response.status}.\nThe full error:\n${error}\n`(theme.error),
  );
  Deno.exit(1);
};

export const codeberg: ReviewTool = {
  async retrievePullRequestTemplate(): Promise<string> {
    return '';
  },
  async createPullRequest(pullRequestCreation: PullRequestCreation, token: string): Promise<PullRequest> {
    const {
      originOwner, repositoryOwner, repositoryName,
      baseBranchName, currentBranchName,
      assignee, title, description,
    } = pullRequestCreation;

    try {
      const response = await request(
        // https://codeberg.org/api/swagger#/repository/repoCreatePullRequest
        `${BASE_URL}/repos/${repositoryOwner}/${repositoryName}/pulls`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title,
            assignee,
            head: `${originOwner}:${currentBranchName}`,
            base: baseBranchName,
            body: description,
          }),
        },
      );

      if (response.status < 300) {
        const pullRequest = await response.json();
        const { html_url: prUrl, number: prNumber } = pullRequest;
        await log(Deno.stdout, stoyle`Your PR is available at ${prUrl} 🎉\n`({ nodes: [theme.link] }));
        return { url: prUrl, number: prNumber };
      }

      return handleResponseError<PullRequest>(response);

    } catch (error) {
      await log(Deno.stderr, stoyleGlobal`Unknown error when creating the PR:\n${(error as Error).stack}\n`(theme.error));
      return Deno.exit(1);
    }
  },
};
