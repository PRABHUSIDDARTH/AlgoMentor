# AlgoMentor Git challenge 6: revert a bad commit.
# Commits a change that breaks app.txt on your default branch. It never pushes or touches remotes.
# Run in PowerShell 7 inside your own clone: pwsh -File bad-commit.ps1
$Challenge = 'revert'
$Files = @('app.txt')
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

Write-Text app.txt "status=ok`nversion=1`n"
G add app.txt
G commit -qm "Add app status file"
Write-Text app.txt "status=BROKEN`nversion=1`n"
G commit -qam "Break app.txt"
$Bad = (& git rev-parse HEAD).Trim()
Write-Marker (',"commitSha":"' + $Bad + '"')
G commit -qm "Set up the revert challenge"

Write-Host @"
Set up: commit $($Bad.Substring(0, 7)) ("Break app.txt") broke app.txt on $Main.
Your turn:
  1. git log --oneline                 (find the bad commit)
  2. Undo it with a new commit, without rewriting history: git revert <sha>
  3. git push origin $Main
"@
