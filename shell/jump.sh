#!/usr/bin/env bash

jump() {
  local tempFile
  tempFile="$(mktemp -t gut_jump_XXXXXX.txt)"

  if gut jump -t "$tempFile" "$@"; then
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
