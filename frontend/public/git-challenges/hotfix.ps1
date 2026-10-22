# AlgoMentor Git challenge 8: cherry-pick a hotfix.
# Puts a typo fix on hotfix/fix-typo next to an unfinished change. It never pushes or touches remotes.
# Run in PowerShell 7 inside your own clone: pwsh -File hotfix.ps1
$Challenge = 'cherry-pick'
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

Write-Text welcome.txt "Welcom to the library!`n"
G add welcome.txt
G commit -qm "Add welcome message"

G switch -qc hotfix/fix-typo
Write-Text welcome.txt "Welcome to the library!`n"
G commit -qam "Fix typo in welcome message"
$Fix = (& git rev-parse HEAD).Trim()
Write-Text banner.txt "Experimental banner, not ready yet`n"
G add banner.txt
G commit -qm "Add experimental banner"

G switch -q $Main
Write-Marker (',"commitSha":"' + $Fix + '","subject":"Fix typo in welcome message","file":"welcome.txt"')
G commit -qm "Set up the cherry-pick challenge"

Write-Host @"
Set up: hotfix/fix-typo has the fix ($($Fix.Substring(0, 7))) and an unfinished banner you don't want on $Main.
Your turn:
  1. Bring only the typo fix to $Main (git cherry-pick), not the whole branch
  2. git push origin $Main
"@
