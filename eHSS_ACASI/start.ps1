$ErrorActionPreference = "Stop"

if (-not $env:NODE_ENV) {
  $env:NODE_ENV = "production"
}

if (-not $env:PORT) {
  $env:PORT = "3000"
}

node backend/src/server.js
