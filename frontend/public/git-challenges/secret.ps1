# AlgoMentor Git challenge 10: remove a committed secret.
# Commits a FAKE key file to your default branch. It never pushes or touches remotes.
# Run in PowerShell 7 inside your own clone: pwsh -File secret.ps1
$Challenge = 'remove-secret'
$Files = @('config/secret.key', 'config/app.properties')
$Branches = @()
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
# Never overwrite the learner's own files or branches: stop before anything is changed.
foreach ($f in $Files) { if (Test-Path $f) { Fail "$f already exists here, and this script would overwrite it. Run it in a scratch clone instead." } }
foreach ($b in $Branches) { & git show-ref --verify --quiet "refs/heads/$b"; if ($LASTEXITCODE -eq 0) { Fail "the branch $b already exists here. Rename it or run this in a scratch clone." } }
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

Write-Text config/secret.key ("ALGOMENTOR-FAKE-KEY-" + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + "`n")
Write-Text config/app.properties "service=library`n"
G add -f config   # -f: the challenge must work even if .gitignore already ignores *.key
G commit -qm "Add service configuration"
Write-Marker ',"file":"config/secret.key"'
G commit -qm "Set up the remove-secret challenge"

Write-Host @"
Set up: config/secret.key (a fake key) is now in $Main's history.
Your turn:
  1. Remove config/secret.key from every commit (git filter-repo, or git rebase -i and amend)
  2. Add it to .gitignore so it can't come back
  3. Push the rewritten history: git push --force-with-lease origin $Main
In real life, a leaked key must also be revoked: rewriting history doesn't un-leak it.
"@
