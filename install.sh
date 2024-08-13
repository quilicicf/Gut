#!/usr/bin/env bash

main() (
  cd "$(git rev-parse --show-toplevel)" || true

  deno install \
    --name 'g' \
    --force \
    --no-check \
    --no-prompt \
    --config=./deno.json \
    --allow-env='HOME' \
    --allow-net='api.github.com' \
    --allow-read="${FORGE},${HOME}/.config/gut/,/tmp" \
    --allow-write="${HOME}/.config/gut/" \
    --allow-run='git,micro,wl-clipboard,firefox-esr,pass' \
    mod.ts
)

main "$@"
