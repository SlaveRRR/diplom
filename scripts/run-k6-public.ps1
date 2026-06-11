param(
  [ValidateSet('api', 'pages')]
  [string]$Target = 'pages',

  [ValidateSet('smoke', 'load', 'stress', 'soak')]
  [string]$Profile = 'stress',

  [string]$BaseUrl = 'https://comicsera.ru',
  [int]$ComicId = 2,
  [int]$PostId = 1,
  [int]$DashboardPort = 5665,
  [Nullable[int]]$MaxVus = $null,
  [string]$RampUpDuration = '30s',
  [string]$HoldDuration = '2m',
  [string]$RampDownDuration = '30s',
  [string]$ThinkTime = '1',
  [switch]$UseDocker
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$loadTestsDir = Join-Path $projectRoot 'load-tests'
$reportsDir = Join-Path $loadTestsDir 'reports'
$scenarioFile = if ($Target -eq 'api') { 'public-api.js' } else { 'public-pages.js' }

if (-not (Test-Path $reportsDir)) {
  New-Item -ItemType Directory -Path $reportsDir | Out-Null
}

$reportName = '{0}-{1}-{2}.html' -f $Target, $Profile, (Get-Date -Format 'yyyyMMdd-HHmmss')
$reportPath = Join-Path $reportsDir $reportName
$relativeScenarioPath = "load-tests/$scenarioFile"

$env:BASE_URL = $BaseUrl
$env:COMIC_ID = [string]$ComicId
$env:POST_ID = [string]$PostId
$env:LOAD_PROFILE = $Profile
$env:THINK_TIME = $ThinkTime
$env:K6_WEB_DASHBOARD_PORT = [string]$DashboardPort
$env:K6_WEB_DASHBOARD_EXPORT = $reportPath

if ($null -ne $MaxVus) {
  $env:MAX_VUS = [string]$MaxVus
  $env:RAMP_UP_DURATION = $RampUpDuration
  $env:HOLD_DURATION = $HoldDuration
  $env:RAMP_DOWN_DURATION = $RampDownDuration
}

$localK6 = Get-Command k6 -ErrorAction SilentlyContinue

if ($localK6 -and -not $UseDocker) {
  Write-Host "Starting k6 with local binary..."
  Write-Host "Dashboard: http://127.0.0.1:$DashboardPort"
  Write-Host "HTML report: $reportPath"
  & $localK6.Source run --out web-dashboard $relativeScenarioPath
  exit $LASTEXITCODE
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
  throw 'Neither local k6 nor docker was found. Install k6 or start Docker Desktop.'
}

try {
  docker version | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'Docker daemon is unavailable.'
  }
} catch {
  throw 'Docker is installed, but the daemon is not running. Start Docker Desktop or install local k6.'
}

$mountProject = "$projectRoot`:/work"

Write-Host "Starting k6 via Docker..."
Write-Host "Dashboard: http://127.0.0.1:$DashboardPort"
Write-Host "HTML report: $reportPath"

docker run --rm `
  -p "${DashboardPort}:${DashboardPort}" `
  -e BASE_URL="$BaseUrl" `
  -e COMIC_ID="$ComicId" `
  -e POST_ID="$PostId" `
  -e LOAD_PROFILE="$Profile" `
  -e THINK_TIME="$ThinkTime" `
  -e MAX_VUS="$($env:MAX_VUS)" `
  -e RAMP_UP_DURATION="$($env:RAMP_UP_DURATION)" `
  -e HOLD_DURATION="$($env:HOLD_DURATION)" `
  -e RAMP_DOWN_DURATION="$($env:RAMP_DOWN_DURATION)" `
  -e K6_WEB_DASHBOARD_PORT="$DashboardPort" `
  -e K6_WEB_DASHBOARD_EXPORT="/work/load-tests/reports/$reportName" `
  -v "$mountProject" `
  -w /work `
  grafana/k6:latest run --out web-dashboard "/work/$relativeScenarioPath"
