Gut specification
=================

Make sure you read the section __Getting started__ before the rest so you are aware of how the flow is supposed to work.

* [Getting started](#getting-started)
  * [Installation](#installation)
    * [Basic features](#basic-features)
    * [Shell features](#shell-features)
  * [Initialization](#initialization)
    * [Gut configuration file](#gut-configuration-file)
    * [Repository configuration file](#repository-configuration-file)
  * [Spirit of the git flow](#spirit-of-the-git-flow)
    * [Organization of your repositories](#organization-of-your-repositories)
    * [Git branching](#git-branching)
      * [Branch flow](#branch-flow)
      * [Branch naming](#branch-naming)
      * [Commit messages format](#commit-messages-format)
* [Git features](#git-features)
  * [Audit](#audit)
  * [Burgeon](#burgeon)
  * [Divisions](#divisions)
  * [Execute](#execute)
  * [History](#history)
  * [Obliterate](#obliterate)
  * [Pile](#pile)
  * [Pushb popb](#pushb-popb)
  * [Replicate](#replicate)
  * [Switch](#switch)
  * [Thrust](#thrust)
* [Contributors section](#contributors-section)
  * [Utilities](#utilities)
    * [Get top level](#get-top-level)
    * [Move up top](#move-up-top)
    * [IsDirty](#isdirty)
    * [HasStagedChanges](#hasstagedchanges)
    * [HasUnstagedChanges](#hasunstagedchanges)

# Getting started

## Installation

### Basic features

~~Just run `npm i -g gut-flow`. You're all set!~~

This package hasn't been released to npmjs.org because it's not stable enough at the moment. 
It'll be released soon but in the meantime, you can try it out by cloning the repository and running `npm link` at the top-level.

### Shell features

Some features gut provides change the terminal's directory or maintain variables that should have the same life span
as the terminal.

It was not possible to implement those in pure NodeJS so some features are implemented in bash. You can find the list
of available shell scripts in the folder [shell](https://github.com/quilicicf/Gut/tree/master/shell).

To use these features, run `gut install` and paste the following code to your `.bashrc`:

```shell
# Installation of Gut scripts, see https://github.com/quilicicf/Gut/blob/master/specs/specs.md#shell-features
# If the link is broken, you probably want to read the README again https://github.com/quilicicf/Gut/blob/master/README.md
installGutScripts() {
  local script
  test -d ~/.config/gut && {
    while read script; do
      . "$script"
    done <<< "$(find ~/.config/gut -name '*.sh')"
  }
}
installGutScripts
```

## Initialization

### Gut configuration file

Gut keeps a configuration file in `~/.config/gut/config.json`.
You'll be guided to build this file when you run any gut command if it does not exist.
To change the configuration, run `gut configure`, it is recommended not to update the file by hand.

Contents of the file:

```json
{
  "accounts": {
    "github": {
      "username": "your GitHub username"
    }
  },
  "repositoriesPath": "The path to your folder containing git repositories. Yes it's assumed all are in one place!",
  "preferredGitServer": "The git server you are using, only github supported ATM"
}
```

For `preferredGitServer` the only git server supported at the time is `github`. Other servers will potentially be
added - as well as the possibility to configure yours - in the future.

### Repository configuration file

Gut will search for a file named `.gut-config.json` at the root of your repositories to retrieve the
repository-specific configuration.

Contents of the file:

```json
{
  "commitMessageSuffixTemplate": "Template of the suffix that should be added to your commit messages"
}
```

- `commitMessageSuffixTemplate`: when committing on a branch that contains a ticket number, gut will look for the
suffix template. If a suffix is found, the template will be used to suffix the commit message, replacing
`$ticketNumber` with the actual ticket number, retrieved from the branch name (see [branch naming](#branch-naming)).

## Spirit of the git flow

### Organization of your repositories

It is assumed you'll keep all your repositories into a single folder, which will be named __forge__ in the rest of
this document and is structured like the following.

```
forge
├── github
│   ├── owner1
│   │   ├── repo1
│   │   └── repo2
│   └── owner2
│       ├── repo1
│       └── repo2
└── gitlab
    ├── owner1
    │   ├── repo1
    │   └── repo2
    └── owner2
        ├── repo1
        └── repo2

```

### Git branching

#### Branch flow

Branch types:
- __Master:__ The branch `master` is a branch that strictly follows the production. It is therefore a faithful
representation of what's in production at ANY MOMENT
- __Version branches:__ When starting the development of a version, a branch is created from master.
- __Feature branches:__ A version can contain multiple features. In case two or more developers work on a feature, they
can create a branch from the version branch. To allow for scope adjustment, the feature can be merged in the next
version if need be.
- __Dev branches:__ When working on a ticket, a dev creates a branch from the feature or version branch.

The following rules apply to the branches:
1. It is allowed to force-push on branches that are only used by a single developer (to create a clean history).
2. As soon as two developers start working on the same branch, force-push is prohibited (I'll implement safe-guards but
that's a little further down the roadmap).
3. To have a clean history, the rebase is preferred to update the version/feature/dev branches to the last modifications.
They should be done when there's the fewest branches open and the branch that's to be rebased must be duplicated
first of course (there'll be tooling down the roadmap for that too).
4. The rebase-and-merge feature is to be preferred when merging branches down.
5. Delivery to the QA team is done y creating a tag named as a time stamp (ISO 8601)
6. When the QA validates a tag, it is merged into master, then production tag is created and named `v<full version>`
7. Build
    1. All version branches and master should be built every time their source code changes
    2. Feature branches can specify they should be built by adding `build` before the `#`
    3. Dev branches should be built when the PR is done or on-demand (a feature is coming to make the on-demand part a
    4. command away

Benefits of this flow:
- there is a branch that follows the production so it's easy to know what's in prod and debug it
- the history is linear and really easy to read
- forgetting to merge something seldom happens
- even if the rebase was not done on alive branches after a merge to master, there should never be devs lost in
translation

Attention points:
- the tag that goes to production is not exactly the tag validated by the QA. If the merge is not smooth, the QA
might need to re-check things
- when a tag is merged into production, all live branches must be rebased

#### Branch naming

- Version branches: `<major version>.<minor version>.<patch version>` ex: `2.3.19`
- Feature branches: `<full version>_#<feature>` ex: `2.3.19_#whatsNewDialog`
- Dev branches: `<full version>_#<feature>_<ticket number>_<dev>` ex: `2.3.19_#whatsNewDialog_8495_optOut` or if
there's no feature branch `2.3.19_456_noLogsBug`

Benefits of this naming:
- No need to look at the commit tree to find where a dev started
- Easy to spot if a branch is not rebased to the right origin (merging `1.2.2_123_totoFeature` in `1.3.0` should
raise an alarm in your head)
- Easy to clean the old local branches, just filter them with regex (there's gonna be a utility for that)
- Easy to interact with CI/CD, the branch is parsable, the ticket number easy to retrieve

#### Commit messages format

Commit messages should be suffixed with the ticket number so that your bug tracker/CI/CD can track them and associate
 the commit to the ticket.

In GitHub, you can suffix your commit message with `#<ticket number>` and GitHub will reference the commit in the
 issue.

In JIRA, you can suffix the commit message with `(<project id>-<ticket number>)` to get the same result.

# Git features

## Audit

Usage: `gut audit`.

Inspects a git diff and displays a summary. Displayed items are:
* Lines added/removed
* Oddities found in the added code
  * TODO
  * FIXME
  * Abusive printing (console.log in JS, System.out.print in Java)
  * Local paths (looks for your home directory)

Arguments:
* `-n` inspect the n last commits (exclusive with -f and -t)
* `-f` the commit from which to start the diff
* `-t` the commit where the diff ends

Example output:

![Inspect output](./images/audit_output.png)

## Burgeon

Usage: `gut burgeon -v 2.10.0`

Creates a new branch and checks it out.

Arguments:
- `-v` create a new version branch, the value of the parameter is the version (follows semver). You can only create a
version branch from master or another version branch.
- `-f` create a new feature branch, the value of the parameter is the feature's description. It can't contain an
underscore. You can only create a feature branch from master or a version branch.
- `-i` only usable with `-f`. If set, the feature branch will be built each time your commit on the branch.
- `-d` create a new dev branch, the value of the parameter is the dev's description. It can't contain an underscore.
You can create dev branches from every type of branches but dev branches.
- `-n` only usable with `-d`. The ticket number associated with the dev.

Examples:
- `gut burgeon -v 2.35.9` (called from `master`) creates a version branch named `2.35.9`
- `gut burgeon -f myFeature -i` (called from `2.35.9`) creates a feature branch named `2.35.9_build#myFeature`
- `gut burgeon -d myDev -n 123` (called from `2.35.9_build#myFeature`) creates a dev branch named
`2.35.9_build#myFeature_123_myDev`

## Divisions

Usage: `gut divisions -r o`.

Displays the branches on a specific remote. The parameter r is the name of the remote or all to show all branches.
There are a few shortcuts to go faster:
- a stands for all
- l stands for local
- o stands for origin
- u stands for upstream

If the parameter is omitted, only the local branches are shown.

## Execute

Usage: `gut execute -m <message>`.

Creates a commit with the provided message.

Arguments:
* `-m`: The commit message. It will be automatically suffixed with the ticket number if available (in the branch name)
and the repository is configured (see [Repository configuration file](#repository-configuration-file))
with `commitMessageSuffixTemplate`. The commit message is an array, you don't need to quote it (see examples).
* `-c`: Creates a code review commit, the message is set to `:eyes: Code review`, suffixed with the ticket number if
applicable. Mutually exclusive with `-m`

Examples:
* `gut execute -m :memo: Specify better commit messages` will create a commit with a message set to
`:memo: Specify better commit messages`. Note: you will need to quote it if you have a word that begin with `-` in the
commit message, otherwise it will be seen as a parameter to the gut command.
* `gut execute -m ':memo: Specify better commit messages'` will create a commit with a message set to
`:memo: Specify better commit messages`.
* `gut execute -c`will create a commit with a message set to `:eyes: Code review`.

The commit should fail if the user has unstaged changes.

## History

Usage: `gut history`.

Displays commits history (equivalent to `git log`).

Arguments:
* `-f` format, the format in the list of predefined formats (see list below, defaults to `pretty`)
* `-s` skip the n first commits in the history (defaults to 0)
* `-n` shows only n commits (default to 100)
* `-r` reverses the order in which the commits are shown. If not specified, the commits will be displayed from newest
 to oldest.

Available formats:
* `pretty`: a colored and well indented format, see screenshot below
* `json`: the commits are returned as a JSON array
* `sha`:  only the shas are returned. Very useful when used with reverse to cherry-pick a few commits!

Log format `pretty`:

![Log format pretty](./images/log_pretty.png)

## Obliterate

Usage: `gut obliterate -b master_deleteSpec -r o`

Deletes an item on the specified remote. Can delete branches and tags.

Arguments:
  * `-r` The remote where the item should be deleted, defaults to `local`. Can be:
    * local: if not defined or in `['l', 'local']`)
    * origin: if in `['o', 'origin']`
    * upstream: if in `['u', 'upstream']`
  * `-b` The name of the branch to delete. Exclusive with `-t`
  * `-t` The name of the tag to delete. Exclusive with `-b`

Examples:
  * `gut obliterate -b master_deleteSpec`: deletes the branch `master_deleteSpec` locally.
  Literally does `git branch -D master_deleteSpec`
  * `gut obliterate -t v1.2.3 -r o` deletes the tag `v1.2.3` on `origin`.
  Literally does `git push --delete origin v1.2.3`

## Pile

Usage: `gut pile`.

Adds all the changes in the repository. Literally does `git add <repository top level> -A`.

## Pushb popb

Usage: `pushb <branch name>; do things; popb`

Works like pushd and popd but for GitHub branches.

> Note: This feature is implemented in bash, it requires some specific [installation steps](#shell-features).

## Replicate

Usage: `gut replicate -s server -o owner -r repo`.

Clones the repository in `<forge>/<server>/<owner>/<repo>`.

If you omit the server, the `preferredGitServer` from your [configuration file](#gut-configuration-file) will be used.
If you omit the owner, the `username` from your [configuration file](#gut-configuration-file) will be used.

## Switch

Usage: `gut switch -t <target branch>`.

Checks out a branch.

Arguments:
- `-t` target branch, if it exists
- `-r` regex to be used to search for the branch to check out
- `-n` search the branch by ticket number

Examples:
- `gut switch -t master` switches to branch `master`
- `gut switch -r myDev` would match branch `9.1.6_2345_myDev` and check it out if it were the only match
- `gut switch -n 2345` would match branch `9.1.6_2345_myDev` and check it out if it were the only match

## Thrust

Usage: `gut thrust`.

Pushes changes to the remote and sets the branches upstream to `<remote>/<branchName>`.
The user can always change the remote to push to but he must do it the first time he pushes a branch if there's more
than one remote configured.

Arguments:
* `-r` remote, the remote to push to

# Contributors section

This section contains information about the internals of this module. They concern you only if either you contribute
 or want to get a picture of how things are implemented.

## Utilities

The file `lib/utils.js` contains all the utility methods that a reused across the whole module. It contains the
following methods.

### Get top level

Usage: `require(./utils.js).getTopLevel()`.

Returns the top level path to the current repository. Literally returns the result of: `git rev-parse --show-toplevel`.

### Move up top

Usage: `require(./utils.js).moveUpTop()`.

Changes directory to top level path of the current repository.
Literally does: `cd "$(git rev-parse  --show-toplevel)"`.

### IsDirty

Usage: `require(./utils.js).isDirty()`

Returns a boolean that tells if the repository it executes in is dirty or not.
Returns the opposite of `git diff --no-ext-diff --quiet --exit-code`.

### HasStagedChanges

Usage: `require(./utils.js).hasStagedChanges()`

Returns a boolean that tells if the repository it executes in has staged changes or not.
Returns the opposite of `git diff-index --cached --quiet HEAD --`.

### HasUnstagedChanges

Usage: `require(./utils.js).hasUnstagedChanges()`

Returns a boolean that tells if the repository it executes in has unstaged changes or not.
Returns the result of `[ -n "$(git ls-files --others --exclude-standard)" ]`.
