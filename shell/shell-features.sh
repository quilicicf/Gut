#!/usr/bin/env bash

# Same as cd but for repositories
# This command is interactive and helps you switch to a repository
# with minimal search text
# $1: The search text, leave empty for full interactive mode
cr() {
  local tempFile
  tempFile="$(mktemp -t gut_jump_XXXXXX.txt)"

  if %GUT_NAME cr "$@" 2> "$tempFile"; then
    cd "$(< "$tempFile")" || {
      printf 'Cannot cd to %s, aborting...\n' "$(< "$tempFile")"
      return 1
    }
    rm "$tempFile" > /dev/null
  else
    rm "$tempFile" > /dev/null
    return 1
  fi
}

# Switches to the top-level of the current repository
# Does nothing if cwd is not in a git repository
uptop() {
  local folder
  if test -n "$(git rev-parse --show-toplevel 2> /dev/null)"; then
    folder="$_"
    cd "${folder}" || {
      printf 'cd to %s failed for an unknown reason\n' "${folder}"
      return 1
    }
  else
    printf 'Not in a git repository\n'
    return 1
  fi
}
