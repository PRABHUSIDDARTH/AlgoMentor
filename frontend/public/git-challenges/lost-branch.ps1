# AlgoMentor Git challenge 7: recover a deleted branch.
# Makes a commit on feature/rescue, then deletes that branch locally. It never pushes or touches remotes.
# Run in PowerShell 7 inside your own clone: pwsh -File lost-branch.ps1
$Challenge = 'rescue-branch'
$ErrorActionPreference = 'Stop'

function Fail([string]$Message) { [Console]::Error.WriteLine("AlgoMentor: $Message"); exit 1 }
function G { & git @args; if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed" } }
& git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) { Fail "run this inside your project's Git repository (your own clone)." }
Set-Location (& git rev-parse --show-toplevel)
& git rev-parse --verify -q HEAD *> $null
if ($LASTEXITCODE -ne 0) { Fail "make a first commit before running this." }
$Main = & git symbolic-ref --short -q HEAD
if ($LASTEXITCODE -ne 0 -or -not $Main) { Fail "you're on a detached HEAD. Check out your default branch first." }
if (& git status --porcelain) { Fail "your working tree is not clean. Commit or stash your changes first." }
if (Test-Path ".algomentor/$Challenge.json") { Fail "this challenge is already set up here (.algomentor/$Challenge.json exists)." }
$Base = (& git rev-parse HEAD).Trim()

# Writes UTF-8 without a BOM and with LF line endings, like the bash version.
function Write-Text([string]$Path, [string]$Text) {
  $dir = Split-Path -Parent $Path
  if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  [IO.File]::WriteAllText((Join-Path (Get-Location) $Path), $Text)
}

# Records where the challenge started, so AlgoMentor can check your work once you push.
function Write-Marker([string]$Extra = '') {
  $created = (Get-Date).ToUniversalTime().ToString("yyyy-MM-dd'T'HH:mm:ss'Z'")
  Write-Text ".algomentor/$Challenge.json" ('{"challenge":"' + $Challenge + '","baseSha":"' + $Base + '","createdAt":"' + $created + '"' + $Extra + "}`n")
  G add ".algomentor/$Challenge.json"
}

G switch -qc feature/rescue
Write-Text rescue.txt "Notes worth keeping.`n"
G add rescue.txt
G commit -qm "Add rescue notes"
$Lost = (& git rev-parse HEAD).Trim()
G switch -q $Main
Write-Marker (',"commitSha":"' + $Lost + '"')
G commit -qm "Set up the rescue-branch challenge"
G branch -qD feature/rescue

Write-Host @"
Set up: feature/rescue had a commit and has just been deleted.
Your turn:
  1. Find the lost commit (git reflog is a good place to look)
  2. Recreate feature/rescue pointing at it
  3. git push origin feature/rescue
  4. git push origin $Main             (so the challenge marker is on GitHub)
"@
