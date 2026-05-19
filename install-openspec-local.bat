@echo off
setlocal

for %%I in ("%~dp0.") do set "ROOT=%%~fI"
cd /d "%ROOT%"

echo.
echo [1/8] Checking Node.js, npm, and pnpm...
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: node was not found in PATH.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found in PATH.
  exit /b 1
)

node --version
call npm --version

echo.
where pnpm >nul 2>nul
if errorlevel 1 (
  echo pnpm was not found in PATH. Installing pnpm globally...
  call npm install -g pnpm
  if errorlevel 1 exit /b 1
)

call pnpm --version

echo.
echo [2/8] Installing dependencies with pnpm...
call pnpm install
if errorlevel 1 (
  echo.
  echo pnpm install failed. Approving dependency build scripts and retrying...
  call pnpm approve-builds --all
  if errorlevel 1 exit /b 1

  call pnpm install
  if errorlevel 1 exit /b 1
)

echo.
echo [3/8] Approving pending dependency build scripts...
call pnpm approve-builds --all
if errorlevel 1 exit /b 1

echo.
echo [4/8] Building OpenSpec...
call pnpm run build
if errorlevel 1 exit /b 1

echo.
echo [5/8] Removing old global OpenSpec package if present...
call npm uninstall -g @fission-ai/openspec

echo.
echo [6/8] Installing this local OpenSpec source globally...
call npm install -g "%ROOT%" --force
if errorlevel 1 exit /b 1

echo.
echo [7/8] Selecting the core workflow profile...
call openspec config profile core
if errorlevel 1 exit /b 1

echo.
echo [8/8] Verifying installed OpenSpec...
where openspec
call openspec --version
call npm root -g

echo.
echo Done. New projects can now run:
echo   openspec init
echo.
echo Existing projects can refresh generated skills and commands with:
echo   openspec update --force
echo.

endlocal
