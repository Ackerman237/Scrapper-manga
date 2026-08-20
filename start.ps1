# start.ps1 — Jalankan server dan opencode di 2 terminal terpisah

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

# Terminal 1: Express server
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root'; npm start"

# Terminal 2: opencode
Start-Process powershell -ArgumentList '-NoExit', '-Command', "Set-Location '$root'; opencode"
