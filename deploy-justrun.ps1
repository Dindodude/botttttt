param(
  [string]$Message = "update Kaiju Reincarnated bot",
  [string]$RemoteUrl = $env:JUSTRUN_GIT_URL,
  [string]$PushRef = $env:JUSTRUN_GIT_REF
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git is not installed or not available in PATH."
}

if (-not $RemoteUrl) {
  throw "Missing JustRunMy.App Git URL. Set JUSTRUN_GIT_URL or pass -RemoteUrl."
}

if (-not $PushRef) {
  $PushRef = "HEAD:deploy"
}

if (-not (Test-Path ".git")) {
  git init
}

$localName = git config user.name
if (-not $localName) {
  git config user.name "Kaiju Bot Deploy"
}

$localEmail = git config user.email
if (-not $localEmail) {
  git config user.email "deploy@kaiju-reincarnated.local"
}

git add -A

$changes = git status --porcelain
if ($changes) {
  git commit -m $Message
} else {
  Write-Host "No file changes to commit."
}

$existingRemotes = git remote
if ($existingRemotes -contains "justrun") {
  git remote remove justrun
} else {
  Write-Host "No existing JustRun remote to remove."
}

git remote add justrun $RemoteUrl
git push -u justrun $PushRef --force

Write-Host "Deploy push complete."
