#!/usr/bin/env bash

main() (
  cd "$(git rev-parse --show-toplevel)" || true

  deno install \
    --force \
    --global \
    --no-check \
    --no-prompt \
    --config=./deno.json \
    --allow-env='HOME,XDG_SESSION_TYPE' \
    --allow-net='api.github.com' \
    --allow-read="${FORGE},${HOME}/.config/gut/,/tmp" \
    --allow-write="${HOME}/.config/gut/" \
    --allow-run='git,micro,wl-copy,firefox,pass' \
    mod.ts
)

main "$@"
