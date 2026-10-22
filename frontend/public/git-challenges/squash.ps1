# AlgoMentor Git challenge 5: squash with an interactive rebase.
# Creates feature/squash with four work-in-progress commits. It never pushes or touches remotes.
# Run in PowerShell 7 inside your own clone: pwsh -File squash.ps1
$Challenge = 'squash'
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

Write-Marker
G commit -qm "Set up the squash challenge"

G switch -qc feature/squash
foreach ($i in 1..4) {
  [IO.File]::AppendAllText((Join-Path (Get-Location) 'squash.txt'), "Squash feature step $i`n")
  G add squash.txt
  G commit -qm "wip $i"
}
G switch -q $Main

Write-Host @"
Set up: feature/squash has 4 "wip" commits.
Your turn:
  1. git switch feature/squash
  2. git rebase -i $Main               (keep the first "pick", change the other three to "squash")
  3. Make the single commit's message exactly: Add squash feature
  4. git push origin feature/squash    (don't merge it)
  5. git switch $Main; git push origin $Main   (so the challenge marker is on GitHub)
"@
