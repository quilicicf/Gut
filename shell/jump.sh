#!/usr/bin/env bash

jump() {
  local tempFile
  tempFile="$(mktemp -t gut_jump_XXXXXX.txt)"

  if gut jump -t "$tempFile" "$@"; then
    cd "$(< "$tempFile")"
    rm "$tempFile" > /dev/null
  else
    rm "$tempFile" > /dev/null
    printf '%bYour search did not match any repository. Please try another one.%b\n' '\e[0;31m' '\e[0m'
    return '1'
  fi
}

