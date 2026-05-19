@echo off
setlocal

for %%I in ("%~dp0.") do set "ROOT=%%~fI"
cd /d "%ROOT%"

echo.
echo [1/7] Checking Node.js and npm...
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
echo [2/7] Installing dependencies...
call npm install
if errorlevel 1 exit /b 1

echo.
echo [3/7] Building OpenSpec...
call npm run build
if errorlevel 1 exit /b 1

echo.
echo [4/7] Removing old global OpenSpec package if present...
call npm uninstall -g @fission-ai/openspec

echo.
echo [5/7] Installing this local OpenSpec source globally...
call npm install -g "%ROOT%" --force
if errorlevel 1 exit /b 1

echo.
echo [6/7] Selecting the core workflow profile...
call openspec config profile core
if errorlevel 1 exit /b 1

echo.
echo [7/7] Verifying installed OpenSpec...
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
