Gut specification
=================

Make sure you read the section __Getting started__ before the rest so you are aware of how the flow is supposed to work.

* [Getting started](#getting-started)
  * [Installation](#installation)
  * [Initialization](#initialization)
    * [Configuration file](#configuration-file)
  * [Spirit of the git flow](#spirit-of-the-git-flow)
    * [Organization of your repositories](#organization-of-your-repositories)
    * [Git branching](#git-branching)
      * [Branch naming](#branch-naming)
* [Git features](#git-features)
  * [Add](#add)
  * [Branch](#branch)
  * [Clone](#clone)
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

### Configuration file

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

#### Branch naming 

TODO

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

## Clone

Usage: `gut clone -s server -o owner -r repo`. 

Clones the repository in `<forge>/<server>/<owner>/<repo>`.

If you omit the server, the `preferredGitServer` from your [configuration file](#configuration-file) will be used.
If you omit the owner, the `username` from your [configuration file](#configuration-file) will be used.

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
