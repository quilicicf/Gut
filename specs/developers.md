<!-- TOC: BEGIN -->
* [Code structure](#code-structure)
* [Utilities](#utilities)
  * [Get top level](#get-top-level)
  * [Move up top](#move-up-top)
  * [IsDirty](#isdirty)
  * [HasStagedChanges](#hasstagedchanges)
  * [HasUnstagedChanges](#hasunstagedchanges)

<!-- TOC: END -->

This section contains information about the internals of this module. They concern you only if either you contribute
 or want to get a picture of how things are implemented.

## Code structure

The code is structured like this:

```
.
├── index.js ======> Gut's entry file, contains all the runnable JS commands
├── lib ===========> All Gut's internals
│   ├── advanced ==> Gut's advanced features (mostly integrations), one file per Gut command
│   ├── git =======> Gut's git features, one file per Gut command
│   └── utils =====> Utility code
├── shell =========> Shell features, one file per feature
├── specs =========> Gut's documentation
└── test ==========> Gut's tests
```

## Utilities

The files in `lib/utils` contain all the utility methods that are reused across the whole module. The following methods deserve special attention.

### Get top level

Usage: `require(./lib/utils/git).getTopLevel()`.

Returns the top level path to the current repository. Literally returns the result of: `git rev-parse --show-toplevel`.

### Move up top

Usage: `require(./lib/utils/git).moveUpTop()`.

Changes directory to the top level path of the current repository. Literally does: `cd "$(git rev-parse  --show-toplevel)"`.

### IsDirty

Usage: `require(./lib/utils/git).isDirty()`

Returns a boolean that tells if the repository it executes in is dirty or not. Returns the opposite of `git diff --no-ext-diff --quiet --exit-code`.

### HasStagedChanges

Usage: `require(./lib/utils/git).hasStagedChanges()`

Returns a boolean that tells if the repository it executes in has staged changes or not. Returns the opposite of `git diff-index --cached --quiet HEAD --`.

### HasUnstagedChanges

Usage: `require(./lib/utils/git).hasUnstagedChanges()`

Returns a boolean that tells if the repository it executes in has unstaged changes or not. Returns the result of `[[ -n "$(git ls-files --others --exclude-standard)" ]]`.
