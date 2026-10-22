# AlgoMentor Git challenge 4: resolve a merge conflict.
# Creates two branches that change the same line of conflict.txt. It never pushes or touches remotes.
# Run in PowerShell 7 inside your own clone: pwsh -File conflict.ps1
$Challenge = 'merge-conflict'
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

Write-Text conflict.txt "Welcome to the library.`nOpening hours: 9 to 5.`n"
Write-Marker ',"file":"conflict.txt"'
G add conflict.txt
G commit -qm "Add opening hours notice"

G switch -qc conflict/theirs
Write-Text conflict.txt "Welcome to the library.`nOpening hours: 10 to 6 on weekdays.`n"
G commit -qam "Extend weekday opening hours"

G switch -q $Main
Write-Text conflict.txt "Welcome to the library.`nOpening hours: 8 to 4, closed on Sundays.`n"
G commit -qam "Open earlier and close on Sundays"

Write-Host @"
Set up: $Main and conflict/theirs both changed line 2 of conflict.txt.
Your turn:
  1. git merge conflict/theirs        (it will stop with a conflict)
  2. Edit conflict.txt so it reads the way you want, removing the <<<<<<< ======= >>>>>>> lines
  3. git add conflict.txt; git commit
  4. git push origin $Main
"@
