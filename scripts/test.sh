#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
PSTACK_ROOT=./pstack node scripts/test.ts
