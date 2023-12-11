#!/usr/bin/env bash

main() (
  cd "$(git rev-parse --show-toplevel)" || true

  jq --compact-output '{ imports: .imports }' \
    < ./deno.json \
    > ./import-map.json

  deno install \
    --name 'g' \
    --force \
    --no-check \
    --no-prompt \
    --import-map=./import-map.json \
    --allow-env='HOME' \
    --allow-net='api.github.com' \
    --allow-read="${FORGE},${HOME}/.config/gut/,/tmp" \
    --allow-write="${HOME}/.config/gut/" \
    --allow-run='git,micro,xclip,firefox-devedition' \
    mod.ts
)

main "$@"
