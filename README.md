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

  * [Configuration](#configuration)

    * [Global configuration](#global-configuration)
    * [Repository configuration](#repository-configuration)

* [Install Gut](#install-gut)

* [CLI documentation](#cli-documentation)

  * [Shell features](#shell-features)

    * [uptop](#uptop)
    * [cr](#cr)

  * [Internals](#internals)

    * [install](#install)

  * [Simple commands](#simple-commands)

    * [audit](#audit)
    * [burgeon](#burgeon)
    * [divisions](#divisions)
    * [execute](#execute)
    * [pile](#pile)
    * [history](#history)
    * [obliterate](#obliterate)
    * [replicate](#replicate)
    * [switch](#switch)
    * [thrust](#thrust)
    * [undo](#undo)
    * [yield](#yield)

  * [Advanced commands](#advanced-commands)

    * [auto-rebase](#auto-rebase)
    * [copy-branch](#copy-branch)
    * [prune-local-branches](#prune-local-branches)
    * [pull-request](#pull-request)
    * [switch-default](#switch-default)

* [F.A.Q](#faq)

* [Contributing](#contributing)

<!-- TOC END -->

## Why Gut?

__One goal: reduce friction with day-to-day git usage.__

This translates into those requirements:

* a simpler API, I won't write my own rant about git's API, plenty of people did [an excellent job](https://stevebennett.me/2012/02/24/10-things-i-hate-about-git/) on that topic
* aggressive aliases to type as few keys as possible. Given the number of git commands a developer types in a day, reducing the command lengths (and typos) is a quick win. You can alias `gut` to `g` and use command/option aliases to type Gut commands way faster
* integrating with the tooling every developer uses along with git:
  * the git server (GitHub, Gitlab, Bitbucket...)
  * the CI server (Jenkins, CircleCI, Travis...)
  * the bug tracker (git server, JIRA...)
  * the messaging system (Slack...)

Most importantly, Gut is built atop git, this means you can use small bits of Gut and still use git for the rest and that using it doesn't force anyone else's hand.

## So how do git and gut compare?

The example below shows the differences in workflow for a simple contribution to a GitHub repository.

The examples take you through a basic workflow:

* clone
* create a dev branch
* develop
* commit
* push
* create a PR

<table style="width:100%">
  <tr>
    <th>Git</th>
    <th>Gut</th>
  </tr>
  <tr>
    <td>
      <pre lang="shell">
        <code>
git clone \
  git@github.com:owner/repository.git \
  ~/github/owner/repository-name
<br>
cd ~/github/owner/repository-name
git checkout -b "TEST-12/myDev"
<br>
# Actual work
<br>
git add . -A
git status -sb
git commit # then write subject/description
git push --set-upstream origin "TEST-12/myDev"
<br>
# Create the PR on GitHub
        </code>
      </pre>
    </td>
    <td>
      <pre lang="shell">
        <code>
g r -s github -o owner -r repository
cr repo
g b -n TEST-12 # then type dev description
<br>
# Actual work
<br>
g p
g e # then complete subject/description
g t
<br>
g pr -oc
        </code>
      </pre>
    </td>
  </tr>
</table>

Differences:

* Easier clone command: no bothering where the repo is going or from where the clone is done
  * BONUS: the server can be omitted (you can set a default one)
  * BONUS 2: the owner can be omitted (if it's you)
* Easier branch creation: type English, let Gut create a valid branch name that contains its lineage (the name of the parent branch)
* Easier staging: Gut always stages all the changes in the repository (you should work on a single task most of the time) and shows the modified files, so you can check easily if you are committing too many files. Git would have you check by hand or stage by hand, both are longer
* Better commit: the commit automatically adds the issue number if you created your branch with it: `g e -n $ISSUE_NUMBER`
* Easier push: by default, Gut sets your branch's upstream, meaning it's tracked correctly. This is what most people do when working with a central server which is the main use-case
* Easier PR creation: the PR creation process is both simplet and better
  * The branch is auto-pushed if it was never pushed before (can save one command)
  * The base branch is auto-detected (from the branch name)
  * The diff from the base branch is audited for `TODO`s, `FIXME`s and other common mistakes
  * The title is pick-able from the PR's commit subjects
  * The description is editable in your favorite text editor
  * You are auto-assigned to the PR (or can assign someone else)
  * All of that without leaving the CLI!
  * BONUS: to share or edit the PR, you can either have it opened automatically in your favorite browser or have its URL copied to your clipboard
* All of this comes with:
  * no need to open GitHub (or any git server) and click everywhere
  * only \~40% of the keystrokes from the git example (without even counting that the git server argument can probably be omitted from the `gut clone`, and the `gut thrust` command can be omitted too) :tada:

> The abbreviated Gut commands do look cryptic but since you type git commands every day, it becomes second nature in days (if not hours).

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

### Configuration

Gut can be configured with a global configuration and repository configuration. The first applies to Gut on all repositories. The second applies only on the repository it is stored in.

#### Global configuration

The schema of the global configuration can be found in [configuration.ts](./src/configuration.ts), search for `GlobalGutConfiguration`.

Its location is `~/.config/.gut-config.json`.

#### Repository configuration

The schema of the repository configuration can be found in [configuration.ts](./src/configuration.ts), search for `RepositoryGutConfiguration`.

Its location is either:

* __PUBLIC:__ `$REPOSITORY_PATH/.gut-config.json` if all the contributors of the repository are OK with committing it
* __PRIVATE:__ `$REPOSITORY_PATH/.git/.gut-config.json` otherwise

If both public and private configurations are defined, the private configuration overwrites the public one.

The overwriting works like this: primitive values in the private configuration take precedence over their counter-parts in the public configuration whatever their depth.

Example:

__PUBLIC__

```json
{
  "messageFormat": "emoji",
  "shouldUseIssueNumbers": true,
  "reviewTool": "github"
}
```

__PRIVATE__

```json
{
  "messageFormat": "angular"
}
```

__EFFECTIVE__

```json
{
  "messageFormat": "angular",
  "shouldUseIssueNumbers": true,
  "reviewTool": "github"
}
```

## Install Gut

> :exclamation: Requires Deno 1.9+

Deno has a permission system that makes it possible to restrict what a Deno process can do on your system.

For your own security, you should review carefully which permissions you give to any script you didn't write yourself.

In this section I'll give you a default installation method with minimal permissions that will prompt you for the few features that require additional rights.

If you want to permanently add the permissions that you are comfortable with, you can alter the installation command to your wishes (run the `deno install` command with `--force` to overwrite the previous installation then).

Each command's documentation explains the additional permissions it might need and for what purpose.

> :light\_bulb: In the script below, `FORGE` must be the path to the folder where all your repositories are. See [the Repositories location section](#repositories-location) for more information.
>
> `HOME` must be the path to your home folder. It is already the case in most systems but in case it's not, Gut will fail to run

> :warning: The link will be updated with a more stable one once the Deno implementation of Gut becomes more stable.

<!-- TODO: also change the host in `install` extraPermissions -->

```shell
deno install \
  --allow-env=HOME \
  --allow-read="${FORGE},${HOME}/.config/gut/" \
  --allow-write="${HOME}/.config/gut/" \
  --allow-run=git,micro \
  --name gut \
  --no-check \
  https://raw.githubusercontent.com/quilicicf/Gut/master/mod.ts
```

| Parameter       | Explanation                                                                                                                                        |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--allow-env`   | Allows Gut to find your home directory so that it can find `~/.config/gut`                                                                         |
| `--allow-read`  | Allows Gut to read the global/repository configuration files, PR templates (ex: from `.github`) and Gut temp files (ex: commit messages)           |
| `--allow-write` | Allows Gut to write to global configuration files and Gut temp files (ex: commit messages, PR descriptions)                                        |
| `--allow-run`   | Allows Gut to run git commands and the text editor [micro](https://micro-editor.github.io/) which is required until I find a way to use any editor |
| `--name`        | The name of the command that will be generated. You can change it if you want (I use `g`, faster to type)                                          |
| `--no-check`    | Makes Deno skip the TypeScript validation before running Gut, it is not needed at runtime                                                          |

## CLI documentation

### Shell features

Gut cannot change the working directory of your shell because it executes in a sub-process.

That means that any feature that requires switching the working directory must be implemented in shell and not Deno.

To cope with this, the shell features described below were developed in shell and the command [`gut install`](#install) helps you install them in your `~/.bashrc` file or equivalent.

The shell features are only usable in a system that can run bash, it should work in WSL though (but I don't have a Windows machine to test that).

#### uptop

This command switches your working directory to the top-level of the repository you are currently in.

It is a glorified `cd "$(git rev-parse --show-toplevel)"`.

#### cr

> `cr` stands for _change repository_, much like `cd` stands for _change directory_

This command helps you switch to a repository interactively to remove as much pain from navigating repositories as possible.

It actually calls Gut to handle the interactive part, then delegates the `cd` call to the shell.

You can call it with a search text directly or without argument. If `cr` finds a unique repository that matches your search, it'll immediately switch to it. Otherwise, you'll be asked interactively to select from the list of candidates.

Examples:

```shell
cr # Opens the interactive select with all repositories listed
cr gu # Opens the interactive select with all repositories that match /gu/ listed
cr gut # Switches to Gut immediately if its the only repository that matches
cr noExisto # Fails miserably because no repository matches this
```

<!-- START CLI DOC -->

### Internals

> Commands dedicated to Gut configuration

#### install

Installs Gut shell features (by copying them in $HOME/.config/gut)

`USAGE: gut install [options...]`

__Options:__

| Name           | Description                                 | Type     | Required | Default value |
| -------------- | ------------------------------------------- | -------- | -------- | ------------- |
| `install-name` | The name you gave to Gut when installing it | `string` | false    | `gut`         |

__Extra permissions:__

| Permission    | Value                       | Reason                                                                                                                    |
| ------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `--allow-net` | `raw.githubusercontent.com` | This permission allows Gut to retrieve the file containing the shell features from GitHub and write it in `~/.config/gut` |

### Simple commands

> Commands that improve an existing git feature

#### audit

Audits a given diff

`USAGE: gut audit [options...]`

__Options:__

| Name                 | Description                                      | Type      | Required | Default value |
| -------------------- | ------------------------------------------------ | --------- | -------- | ------------- |
| `commits-number`     | The number of commits to inspect                 | `integer` | false    |               |
| `from-parent-branch` | Audit all commits on top of the parent branch    | `boolean` | false    |               |
| `from`               | The sha of the commit from which the diff starts | `string`  | false    |               |
| `to`                 | The sha of the commit where the diff ends        | `string`  | false    |               |

#### burgeon

Creates a branch

`USAGE: gut burgeon [options...]`

__Options:__

| Name           | Description                                           | Type      | Required | Default value |
| -------------- | ----------------------------------------------------- | --------- | -------- | ------------- |
| `issue-number` | Specifies the issue number when creating a new branch | `string`  | false    |               |
| `poc`          | Specifies that the branch contains a PoC              | `boolean` | false    |               |

#### divisions

Displays the given remote's branches

`USAGE: gut divisions [options...]`

__Options:__

| Name     | Description                                   | Type     | Required | Default value |
| -------- | --------------------------------------------- | -------- | -------- | ------------- |
| `remote` | The remote whose branches should be displayed | `string` | false    |               |

#### execute

Commits the staged changes

`USAGE: gut execute [options...]`

__Options:__

| Name             | Description                                                    | Type      | Required | Default value |
| ---------------- | -------------------------------------------------------------- | --------- | -------- | ------------- |
| `code-review`    | Auto set the message to: Code review                           | `boolean` | false    |               |
| `wip`            | Auto set the message to: WIP                                   | `boolean` | false    |               |
| `squash-on`      | Choose a commit in history and squash the staged changes in it | `boolean` | false    |               |
| `squash-on-last` | Squash the changes on the last commit in history               | `boolean` | false    |               |

#### pile

Adds all changes in the repository

`USAGE: gut pile [options...]`

#### history

Displays the commit history

`USAGE: gut history [options...]`

__Options:__

| Name                 | Description                                             | Type      | Required | Default value |
| -------------------- | ------------------------------------------------------- | --------- | -------- | ------------- |
| `format`             | The format name. Defaults to pretty                     | `string`  | false    | `pretty`      |
| `number`             | Limit the number of commits to output                   | `number`  | false    | `10`          |
| `reverse`            | Output the commits chosen to be shown in reverse order. | `boolean` | false    |               |
| `from-parent-branch` | Audit all commits on top of the parent branch           | `boolean` | false    |               |
| `from-other-branch`  | Audit all commits on top of the provided branch         | `string`  | false    |               |

#### obliterate

Deletes a branch or a tag

`USAGE: gut obliterate [options...]`

__Options:__

| Name         | Description                                                                          | Type      | Required | Default value |
| ------------ | ------------------------------------------------------------------------------------ | --------- | -------- | ------------- |
| `branch`     | The branch to delete                                                                 | `string`  | false    |               |
| `tag`        | The tag to delete                                                                    | `string`  | false    |               |
| `remote`     | The remote where the item should be deleted. Leave empty to delete the item locally. | `string`  | false    |               |
| `assume-yes` | Does not show confirmation before deleting. To be used with caution.                 | `boolean` | false    |               |

#### replicate

Clones a repository

`USAGE: gut replicate [options...]`

__Options:__

| Name         | Description                                                                                                 | Type     | Required | Default value |
| ------------ | ----------------------------------------------------------------------------------------------------------- | -------- | -------- | ------------- |
| `server`     | The git server where the repository is, defaults to the preferred git server from global configuration file | `string` | false    |               |
| `owner`      | The owner of the repository to be cloned.                                                                   | `string` | false    |               |
| `repository` | The name of the repository to be cloned.                                                                    | `string` | true     |               |

#### switch

Checks out a branch

`USAGE: gut switch [search] [options...]`

__Options:__

| Name             | Description                                                             | Type      | Required | Default value |
| ---------------- | ----------------------------------------------------------------------- | --------- | -------- | ------------- |
| `master`         | Switch to master                                                        | `boolean` | false    |               |
| `parent`         | Switch to parent branch                                                 | `boolean` | false    |               |
| `default-branch` | Switch to the default branch on the provided remote. Defaults to origin | `string`  | false    |               |
| `last`           | Switch to last branch                                                   | `boolean` | false    |               |
| `tags-only`      | Only choose from tags                                                   | `boolean` | false    |               |
| `branches-only`  | Only choose from branches                                               | `boolean` | false    |               |
| `search`         | Search text to filter the candidates                                    | `string`  | false    |               |

#### thrust

Pushes local changes to a remote

`USAGE: gut thrust [options...]`

__Options:__

| Name    | Description                                                 | Type      | Required | Default value |
| ------- | ----------------------------------------------------------- | --------- | -------- | ------------- |
| `force` | Force the push. This erases concurrent server-modifications | `boolean` | false    |               |

#### undo

Undoes commits

`USAGE: gut undo [options...]`

__Options:__

| Name             | Description                                                                      | Type      | Required | Default value |
| ---------------- | -------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| `commits-number` | The number of commits to undo                                                    | `integer` | false    | `1`           |
| `stash-changes`  | Stashes the changes                                                              | `boolean` | false    |               |
| `description`    | Sets the description used as stash entry if --stash-changes is used              | `string`  | false    |               |
| `hard`           | Deletes the changes permanently, a confirmation is prompted to prevent data loss | `boolean` | false    |               |

#### yield

Fetches from git server

`USAGE: gut yield [options...]`

__Options:__

| Name      | Description                                             | Type      | Required | Default value |
| --------- | ------------------------------------------------------- | --------- | -------- | ------------- |
| `no-pull` | Do not pull the changes to the current branch           | `boolean` | false    |               |
| `force`   | Whether the pulling of a branch should be forced or not | `boolean` | false    |               |

### Advanced commands

> Commands that either connect to external tools or combine multiple git features

#### auto-rebase

Re-bases the parent branch on the given remote, then re-bases the current branch on top of it.
Stashes the local changes first if there are any

`USAGE: gut auto-rebase [options...]`

__Options:__

| Name     | Description            | Type     | Required | Default value |
| -------- | ---------------------- | -------- | -------- | ------------- |
| `remote` | The remote to fetch    | `string` | false    | `origin`      |
| `base`   | The base branch to use | `string` | false    |               |

#### copy-branch

Copies the current branch name in the clipboard

`USAGE: gut copy-branch [options...]`

__Extra permissions:__

| Permission    | Value                                                       | Reason                                                    |
| ------------- | ----------------------------------------------------------- | --------------------------------------------------------- |
| `--allow-run` | `powershell` (Windows)<br>`pbcopy` (Mac)<br>`xclip` (Linux) | Allows writing the current branch's name to the clipboard |

#### prune-local-branches

Removes all local branches that:

* are older than the specified age
* have no remote counter-part
* are not tagged as PoC
* are not `master`, or the current branch

`USAGE: gut prune-local-branches [options...]`

__Options:__

| Name      | Description                                  | Type     | Required | Default value |
| --------- | -------------------------------------------- | -------- | -------- | ------------- |
| `remote`  | The remote used to find remote counter-parts | `string` | false    | `origin`      |
| `max-age` | The max age in days for the branches         | `string` | false    | `30`          |

#### pull-request

Creates a pull request on your git server

`USAGE: gut pull-request [options...]`

__Options:__

| Name          | Description                                                                                    | Type      | Required | Default value |
| ------------- | ---------------------------------------------------------------------------------------------- | --------- | -------- | ------------- |
| `open`        | Open the PR in the system's default browser                                                    | `boolean` | false    |               |
| `copy-url`    | Copies the PR's URL to the system's clipboard.                                                 | `boolean` | false    |               |
| `assignee`    | Sets the PR's assignee, defaults to the creator                                                | `string`  | false    |               |
| `base-branch` | Define the base branch on which the PR will be created manually. Defaults to the parent branch | `string`  | false    |               |
| `remote`      | The remote on which the PR will be done                                                        | `string`  | false    | `origin`      |

__Extra permissions:__

| Permission    | Value                                                                              | Reason                                                                                                                                                                 |
| ------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--allow-run` | `powershell,explorer` (Windows)<br>`pbcopy,open` (Mac)<br>`xclip,xfg-open` (Linux) | Allows:<ul><li>Writing the PR's URL to the clipboard when `--copy-url` is set</li><br><li>Opening the PR's URL with the default browser when `--open` is set</li></ul> |

#### switch-default

Fetches the origin's default branch, then switches to it

`USAGE: gut switch-default [options...]`

__Options:__

| Name     | Description         | Type     | Required | Default value |
| -------- | ------------------- | -------- | -------- | ------------- |
| `remote` | The remote to check | `string` | false    | `origin`      |

<!-- END CLI DOC -->

## F.A.Q

__Q (Performance guru):__ Why is it written in JS/TS? :scream:

__R:__ Well, it was formerly [written in bash](https://github.com/quilicicf/Tooling/bashrc) but believe it or not, it was not productive! Deno's ecosystem is rich and makes lots of tasks way faster to develop. The performance difference (yes I'm aware that TS won't be fast) is not visible as git accounts for most of the time spent on any command. I also get to experiment with Deno & TS, learning is good.

__Q (Native English speaker):__ Why those weird command names tho?

__R:__ As you may have noticed, `gut` is a typo away from `git` on most keyboards. It is way better to make commands as different as possible so that you know which of these you are using! Plus it's fun.

__Q (Git specialist):__ I can see the gains for some usage but Gut can't do everything git can, far from that!

__R:__ Yes indeed. Gut is supposed to speed up the 80% of your work that falls in the simple uses cases. Whenever you fall in the complex situations that are bound to happen in any serious git project, you should use git as you do today.

## Contributing

[How to contribute to Gut](./.github/CONTRIBUTING.md).
