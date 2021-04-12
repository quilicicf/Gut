# Gut

Ein gut git Fluss [🔊](https://translate.google.com/?sl=de\&tl=en\&text=Ein%20gut%20git%20Fluss\&op=translate)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Build status](https://travis-ci.org/quilicicf/Gut.svg?branch=master)](https://travis-ci.org/quilicicf/Gut/builds)
[![Maintainability](https://api.codeclimate.com/v1/badges/a090970db27a541d83b3/maintainability)](https://codeclimate.com/github/quilicicf/Gut/maintainability)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d5723842f6e14066a6e68e692ced1c4e)](https://www.codacy.com/app/quilicicf/Gut?utm_source=github.com\&utm_medium=referral\&utm_content=quilicicf/Gut\&utm_campaign=Badge_Grade)

<!-- TOC START -->

* [Why Gut?](#why-gut)

* [So how do git and gut compare?](#so-how-do-git-and-gut-compare)

* [Gut flow](#gut-flow)

  * [Repositories location](#repositories-location)
  * [Branch naming](#branch-naming)

* [CLI documentation](#cli-documentation)

* [F.A.Q](#faq)

* [Contributing](#contributing)

<!-- TOC END -->

## Why Gut?

__One goal: reduce friction with day-to-day git usage.__

This translates into those requirements:

* a simpler API, I won't write my own rant about git's API, plenty of people did [an excellent job](https://stevebennett.me/2012/02/24/10-things-i-hate-about-git/) on that topic
* aggressive aliases to type as few keys as possible. Given the number of git commands a developer types in a day, reducing the command lengths (and typos) is a quick win. You can alias `gut` to `g` and use command/option aliases to type Gut commands super-fast
* integrating with the tooling every developer uses along with git:
  * the git server (GitHub, Gitlab, Bitbucket...)
  * the CI server (Jenkins, CircleCI, Travis...)
  * the bug tracker (git server, JIRA...)
  * the messaging system (Slack...)

Most importantly, Gut is built atop git, this means you can use small bits of Gut and still use git for the rest and that using it doesn't force anyone else's hand.

## So how do git and gut compare?

The example below shows the differences in workflow for a simple contribution to a GitHub repository.

<table style="width:100%">
  <tr>
    <th>Git</th>
    <th>Gut</th>
  </tr>
  <tr>
    <td>
      <pre lang="shell">
# The long command below or a cd to $REPOSITORIES_PATH before cloning
# You either have to remember the syntax or open GitHub to find the URL
git clone git@github.com:owner/repository.git "$REPOSITORIES_PATH/repository-name"
# You must cd to begin working
cd "$REPOSITORIES_PATH/repository-name"
# Create the new branch
git checkout -b "$devBranchName"
<br>
# Actual work
<br>
git add . -A
# To verify which files where changed
git status -sb
# Add the ticket number by hand so that GitHub tracks the commit in the ticket
git commit
# Set the upstream by hand, 99% of the case you will type this exact line
git push --set-upstream origin "$devBranchName"
<br>
# Open GitHub
# Use the compare and pull request feature to create a PR
# You must select the base branch yourself, and write the title
# 99% of the cases, the title of the PR can be the commit subject
      </pre>
    </td>
    <td>
      <pre lang="shell">
# The path where the repository is cloned is defined in gut's configuration
gut replicate -s 'github' -o 'owner' -r 'repository'
# Find the repository in the repositories path with interactive fuzzy search and cd to it
cr
# Creates a branch with a name including the ticket number for later use
gut burgeon -n ticketNumber
<br>
# Actual work
<br>
# Add all the un-staged changes in the repository, show the changed files with git status -sb
gut pile
# Create the commit, ticket number is added automatically
gut execute
# Push to the server, upstream is set by default to "origin/$devBranchName"
gut thrust
<br>
# Audit the PR for TODOs, FIXMEs etc...
# Help you build the PR (title from PR commits or hand-written, description with template supported)
# Output the PR's URL, or open the PR, or copy the URL to clipboard
# Better yet, the base branch is deducted from the name of the current branch!
# Sets yourself as assignee
gut pr --open --copy-url
      </pre>
    </td>
  </tr>
</table>

## Gut flow

Gut relies on two conventions to function.

### Repositories location

For Gut to work properly, all your repositories must be located in a single folder with a specific structure described below. This folder will be called __forge__ in the rest of this manual.

```
forge
├── github          <== Level 1: Git server name
│   ├── owner1      <== Level 2: Repository owner
│   │   ├── repo1   <== Level 3: Repository name
│   │   └── repo2
│   └── owner2
│       ├── repo1
│       └── repo2
└── gitlab
    ├── owner1
    │   ├── repo1
    │   └── repo2
    └── owner2
        ├── repo1
        └── repo2
```

This allows Gut to search/cd your repositories and to clone them efficiently.

It also allows you to perform text search in all the repositories of an organization for example, which can be powerful.

### Branch naming

Gut also relies on a specific branch naming for features such as:

* audit commits from parent branch
* create PR on parent branch
* add ticket number in commit subjects

By convention, Gut branches are divided in fragments separated by double underscores, ex: `$FRAGMENT1__$FRAGMENT2__$FRAGMENT3`.

This means that the branch was created on top of `$FRAGMENT1__$FRAGMENT2`, which was itself created on top of `$FRAGMENT1`.

Each fragment can contain the following parts `${POC_INDICATOR}${ISSUE_NUMBER}${DESCRIPTION}`, where:

* `POC_INDICATOR` (__optional__): has a fixed value of `POC--`, indicates that the branch contains a PoC. This means it should never be merged and should not be deleted hastily (PoCs usually have a longer lifecycle than normal branches)
* `ISSUE_NUMBER` (__optional__): is the number of the issue you are working on in your bug tracker (ex: `PROJ-123`). Gut can retrieve it and add it at the end of your commit subjects so that your bug tracker can link commits with issues. It must be separated from the `DESCRIPTION` by a single `_`, and therefore, can't contain one itself.
* `DESCRIPTION` (__mandatory__): is the issue's description. It must detail what you are doing in the branch (ex: `addOauth2Authentication`). It can only contain `[a-zA-Z0-9-]`. This is more restrictive than what git permits for good reasons (ex: avoid shell escaping & URL encoding issues).

> By convention, any single-fragment branch that is not `master` is considered a child of `master`

A few valid examples:

* `master`
* `master__springCleanupVersion`
* `master__springCleanupVersion__PROJ-123_removeObsoleteModuleToto`
* `master__POC--tryUsingNodeModuleYInsteadOfX`

## CLI documentation

<!-- TODO: automate CLI documentation -->

## F.A.Q

__Q (Performance guru):__ Why is it written in JS/TS? :scream:

__R:__ Well, it was formerly [written in bash](https://github.com/quilicicf/Tooling/bashrc) but believe it or not, it was not productive! Deno's ecosystem is rich and makes lots of tasks way faster to develop. The performance difference (yes I'm aware that TS won't be fast) is not visible as git accounts for most of the time spent on any command. I also get to experiment with Deno & TS, learning is good.

__Q (Native English speaker):__ Why those weird command names tho?

__R:__ As you may have noticed, `gut` is a typo away from `git` on most keyboards. It is way better to make commands as different as possible so that you know which of these you are using! Plus it's fun.

__Q (Git specialist):__ I can see the gains for some usage but Gut can't do everything git can, far from that!

__R:__ Yes indeed. Gut is supposed to speed-up the 80% of your work that falls in the simple uses cases. Whenever you fall in the complex situations that are bound to happen in any serious git project, you should use git as you do today.

## Contributing

[How to contribute to Gut](./.github/CONTRIBUTING.md).
