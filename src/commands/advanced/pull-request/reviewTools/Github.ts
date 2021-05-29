import log from '../../../../dependencies/log.ts';
import { exists } from '../../../../dependencies/fs.ts';
import { resolve } from '../../../../dependencies/path.ts';
import { stoyle, stoyleGlobal, theme } from '../../../../dependencies/stoyle.ts';

import { request } from '../../../../lib/request.ts';
import { readTextFile } from '../../../../lib/readTextFile.ts';
import { getTopLevel } from '../../../../lib/git/getTopLevel.ts';

import { PullRequest, PullRequestCreation, ReviewTool } from '../ReviewTool.ts';

const BASE_URL = 'https://api.github.com';

const handleResponseError = async <T> (response: Response): Promise<T> => {
  const body = await response.json();
  const message = body?.message;
  const firstError = body?.errors?.[ 0 ];

  if (message && !firstError) {
    await log(Deno.stderr, stoyleGlobal`GitHub API call failed with message: ${message}.\n`(theme.error));
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
    stoyleGlobal`GitHub API call failed with status ${response.status}.\nThe full error:\n${error}\n`(theme.error),
  );
  Deno.exit(1);
};

const setAssigneeIfApplicable = async (
  pullRequestCreation: PullRequestCreation, pullRequest: PullRequest, token: string,
) => {

  const { number } = pullRequest;
  const { repositoryOwner, repositoryName, assignee } = pullRequestCreation;
  try {
    await request(
      // https://docs.github.com/en/rest/reference/issues#add-assignees-to-an-issue
      `${BASE_URL}/repos/${repositoryOwner}/${repositoryName}/issues/${number}/assignees`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ assignees: [ assignee ] }),
      },
    );
  } catch (error) {
    await log(Deno.stderr, stoyleGlobal`Could not set assignee for PR ${number}\n`(theme.error));
  }
};

export const github: ReviewTool = {
  async retrievePullRequestTemplate (): Promise<string> {
    const topLevel = await getTopLevel();
    const pullRequestTemplatePath = resolve(topLevel, '.github', 'PULL_REQUEST_TEMPLATE.md');

    if (!await exists(pullRequestTemplatePath)) { return ''; }

    return readTextFile(pullRequestTemplatePath, { permissionPath: topLevel });
  },
  async createPullRequest (pullRequestCreation: PullRequestCreation, token: string): Promise<PullRequest> {
    const {
      originOwner, repositoryOwner, repositoryName,
      baseBranchName, currentBranchName,
      title, description,
    } = pullRequestCreation;

    try {
      const response = await request(
        // https://docs.github.com/en/rest/reference/pulls#create-a-pull-request
        `${BASE_URL}/repos/${repositoryOwner}/${repositoryName}/pulls`,
        {
          method: 'POST',
          headers: {
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            Authorization:
              `Bearer ${token}`
            ,
          },
          body: JSON.stringify({
            title,
            head: `${originOwner}:${currentBranchName}`,
            base: baseBranchName,
            body: description,
          }),
        },
      );

      if (response.status < 299) {
        const pullRequest = await response.json();
        const { html_url: prUrl } = pullRequest;
        await log(Deno.stdout, stoyle`Your PR is available at ${prUrl} 🎉\n`({ nodes: [ theme.link ] }));
        await setAssigneeIfApplicable(pullRequestCreation, pullRequest, token);
        return { url: prUrl, number: pullRequest.number };
      }

      return handleResponseError<PullRequest>(response);

    } catch (error) {
      await log(Deno.stderr, stoyleGlobal`Unknown error when creating the PR:\n${error.stack}\n`(theme.error));
      return Deno.exit(1);
    }
  },
};
