#!/usr/bin/env bash

export GIT_BRANCHES_STACK=''

pushb() {
  local oldBranch
  local newBranch="${1?Missing new branch}"
  oldBranch="$(git branch | grep '^\*' | awk '{print $2}')"
  git checkout "$newBranch" && {
    _appendBranch "$oldBranch"
  }
}

popb() {
  local oldBranch
  [ -z "$GIT_BRANCHES_STACK" ] && {
    printf '%bBranch stack empty%b\n'
    return 1
  }

  oldBranch="$(tail -1 <<< "$GIT_BRANCHES_STACK")"
  GIT_BRANCHES_STACK="$(head -n -1 <<< "$GIT_BRANCHES_STACK")"

  git checkout "$oldBranch"
}

_appendBranch() {
  local oldBranch="$1"
  if [ -z "$GIT_BRANCHES_STACK" ]; then
    GIT_BRANCHES_STACK="$oldBranch"
  else
    GIT_BRANCHES_STACK="$(printf '%s\n%s\n' "$GIT_BRANCHES_STACK" "$oldBranch")"
  fi
}
