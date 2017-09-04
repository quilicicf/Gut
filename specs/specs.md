Gut specification
=================

Make sure you read the section __Getting started__ before the rest so you are aware of how the flow is supposed to work.

* [Getting started](#getting-started)
  * [Installation](#installation)
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
  * [Add](#add)
  * [Branch](#branch)
  * [Checkout](#checkout)
  * [Clone](#clone)
  * [Commit](#commit)
  * [Log](#log)
* [Contributors section](#contributors-section)
  * [Utilities](#utilities)
    * [Get top level](#get-top-level)
    * [Move up top](#move-up-top)
    * [IsDirty](#isdirty)
    * [HasStagedChanges](#hasstagedchanges)
    * [HasUnstagedChanges](#hasunstagedchanges)

# Getting started

## Installation

Just run `npm i -g gut-flow`. You're all set!

## Initialization

### Gut configuration file

Gut keeps a configuration file in `~/.gut-config.json`. 
This file is automatically bootstrapped to a (currently fixed) value at startup if it is not found.

Contents of the file:

```json
{
  "username": "Your git username",
  "repositoriesPath": "The path to your folder containing git repositories. Yes it's assumed all are in one place!",
  "preferredGitServer": "The git server you are using"
}
```

For `preferredGitServer` the only accepted value at the time is github. Other servers will be added as well as the 
possibility to configure yours in the future.

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
1. As soon as two developers start working on the same branch, force-push is prohibited (I'll implement safe-guards but 
that's a little further down the roadmap).
1. To have a clean history, the rebase is preferred to update the version/feature/dev branches to the last modifications. 
They should be done when there's the fewest branches open and the branch that's to be rebased must be duplicated 
first of course (there'll be tooling down the roadmap for that too).
1. The rebase-and-merge feature is to be preferred when merging branches down.
1. Delivery to the QA team is done y creating a tag named as a time stamp (ISO 8601)
1. When the QA validates a tag, it is merged into master, then production tag is created and named `v<full version>`

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
- Feature branches: `<full version>_<feature>` ex: `2.3.19_whatsNewDialog`
- Dev branches: `<full version>_<feature>_<ticket number>_<dev>` ex: `2.3.19_whatsNewDialog_8495_optOut` or if 
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

## Add

Usage: `gut add`.

Adds all the changes in the repository. Literally does `git add <repository top level> -A`.

## Branch

Usage: `gut branch -r o`.

Displays the branches on a specific remote. The parameter r is the name of the remote or all to show all branches. 
There are a few shortcuts to go faster: 
- a stands for all
- l stands for local
- o stands for origin
- u stands for upstream

If the parameter is omitted, only the local branches are shown.

## Checkout

Usage: `gut checkout -t <target branch>`.

Checks out a branch. You can create the branch and check it out in a single command.

Arguments: 
- `-t` target branch, if it exists
- `-v` create a new version branch, the value of the parameter is the version (follows semver). You can only create a 
version branch from master.
- `-f` create a new feature branch, the value of the parameter is the feature's description. It can't contain an 
underscore. You can only create a feature branch from master or a version branch.
- `-i` only usable with `-f`. Is set, the feature branch will be built each time your commit on the branch.
- `-d` create a new dev branch, the value of the parameter is the dev's description. It can't contain an underscore. 
You can create dev branches from every type of branches but dev branches.
- `-n` only usable with `-d`. The ticket number associated with the dev.

Examples:
- `gut checkout -t master` switches to branch `master`
- `gut checkout -v 2.35.9` (called from `master`) creates a version branch named `2.35.9`
- `gut checkout -f myFeature -i` (called from `2.35.9`) creates a feature branch named `2.35.9_build#myFeature`
- `gut checkout -d myDev -n 123` (called from `2.35.9_build#myFeature`) creates a dev branch named 
`2.35.9_build#myFeature_123_myDev`

## Clone

Usage: `gut clone -s server -o owner -r repo`. 

Clones the repository in `<forge>/<server>/<owner>/<repo>`.

If you omit the server, the `preferredGitServer` from your [configuration file](#configuration-file) will be used.
If you omit the owner, the `username` from your [configuration file](#configuration-file) will be used.

## Commit

Usage: `gut commit -m <message>`. 

Creates a commit with the provided message.

Arguments: 
* `-m`: The commit message, suffixed with the ticket number if available (in the branch name) and the repository is 
configured (see [Repository configuration file](#repository-configuration-file)) with `commitMessageSuffixTemplate`
* `-c`: Creates a code review commit, the message is set to `:eyes: Code review`, suffixed with the ticket number if 
applicable. Mutually exclusive with `-m`

The commit should fail if the user has unstaged changes.

## Log

Usage: `gut log`.

Displays commits history.

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
