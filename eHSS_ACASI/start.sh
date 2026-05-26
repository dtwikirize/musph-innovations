#!/usr/bin/env bash
set -euo pipefail

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${PORT:-3000}"

node backend/src/server.js
