#!/usr/bin/env bash

jump() {
  local tempFile
  tempFile="$(mktemp -t gut_jump_XXXXXX.txt)"

  if gut jump -t "$tempFile" "$@"; then
    cd "$(< "$tempFile")"
    rm "$tempFile" > /dev/null
  else
    rm "$tempFile" > /dev/null
    return '1'
  fi
}

