# Gut

Ein gut git Flow [🔊](https://translate.google.com/?tl=de#de/en/Ein%20gut%20git%20Flow)

### Info

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![tested with jest](https://img.shields.io/badge/tested_with-jest-99424f.svg)](https://github.com/facebook/jest)

### Status

[![Dependency Status](https://david-dm.org/quilicicf/gut.svg)](https://david-dm.org/quilicicf/gut)
[![Known Vulnerabilities](https://snyk.io/test/github/quilicicf/gut/badge.svg)](https://snyk.io/test/github/quilicicf/gut)
[![Build status](https://travis-ci.org/quilicicf/Gut.svg?branch=master)](https://travis-ci.org/quilicicf/Gut/builds)

### Static analysis

[![Maintainability](https://api.codeclimate.com/v1/badges/a090970db27a541d83b3/maintainability)](https://codeclimate.com/github/quilicicf/Gut/maintainability)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d5723842f6e14066a6e68e692ced1c4e)](https://www.codacy.com/app/quilicicf/Gut?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=quilicicf/Gut&amp;utm_campaign=Badge_Grade)

## Why Gut?

Gut was created to answer to a specific need: reduce friction when working with git on a day-to-day basis.

This translates into two requirements:
- a simpler API, I won't write my own rant about git's API, plenty of people did [an excellent job](https://stevebennett.me/2012/02/24/10-things-i-hate-about-git/) on that topic
- integrating with all the tooling every developer uses along with git. This includes:
  - the git server (GitHub, Gitlab, Bitbucket...)
  - the CI server (Jenkins, CircleCI, Travis...)
  - ticketing system (git server, JIRA...)
  - the messaging system (Slack...)

But most importantly, gut is built atop git, this means you can use small bits of gut and still use git for the rest and that the whole team is not supposed to switch to gut if one guy does it.

## So how do git and gut compare?

The example below shows the differences in workflow for a simple contribution on a GitHub repository.
Each line represents a user action.

<table style="width:100%">
  <tr>
    <th>Git</th>
    <th>Gut</th>
  </tr>
  <tr>
    <td>
		<pre lang="shell">
        cd "$REPOSITORIES_PATH"
        git clone git@github.com:owner/repository.git # Or open GitHub page and copy the path
        cd 'repository'
        git checkout -b "$devBranchName"
        # Actual work
        git add . -A
        git status -sb # To verify which files where changed
        git commit -m ":new: My new feature #$ticketNumber" # Add the ticket number by hand so that  GitHub tracks the changes in the ticket
        git push --set-upstream-to "origin/$devBranchName"
        # Open GitHub
        # Use the compare and pull request feature to create a PR
        # Copy the PR URL
        # Open your chat system
        # Paste it with a message to ask a team mate to review it
        </pre>
    </td>
    <td>
		<pre lang="shell">
        gut replicate -s 'github' -o 'owner' -r 'repository' # The path where the repository is cloned is defined in gut's configuration
        jump repository # Find the repository in the repositories path by glob and cd it
        gut burgeon -n ticketNumber -d devDescription # Creates a branch with a name including the ticket number for later use
        # Actual work
        gut pile # Adds all the unstaged changes in the repository, shows the changed files with git status -sb
        gut execute -m :new: My new feature # Creates the commit, no quotes for the message, ticket number is added automatically
        git thrust # Pushes to the server, upstream is set by default to "origin/$devBranchName"
        gut pr # Audits the PR for TODOs, FIXMEs etc..., helps you build the PR (title, description). Outputs the PR's URL
        # COMING SOON => write a message to Slack with the PR's URL automatically added
        </pre>
    </td>
  </tr>
</table>

## Getting started

All the documentation you need is in the __[USER DOCUMENTATION](./specs/user_documentation.md)__.

From installation to commands and git flow explanation, you should find everything there.

If something's amiss, please create an issue.

## F.A.Q

__Q (Bearded ops guy):__ Why is it written in NodeJS? :scream:

__R:__ Well, it was formerly [written in bash](https://github.com/quilicicf/Tooling/bashrc) but believe it or not, it was not productive! NodeJS's ecosystem is rich and makes lots of tasks way faster to develop. The performance difference (yes I'm aware that NodeJS won't be fast) is not visible as git accounts for most of the time spent on any command. I also get to experiment on recent JS syntax which for a full-stack developer as myself is a plus.

__Q (English native speaker):__ Why those weird command names tho?

__R:__ As you may have noticed, gut is a typo away from git on most keyboards. It is way better to make commands as different as possible so that you know which of these you are using! Plus it's fun.

__Q (Git specialist):__ I can see the gains for some usage but gut can't do everything git can, far from that!

__R:__ Yes indeed. Gut is supposed to speed-up the 80% of your work that falls in the simple uses cases. Whenever you fall in the complex situations that are bound to happen in any serious git project, you should use git as you do today.

## Contributing

[How to contribute to Gut](./.github/CONTRIBUTING.md).
