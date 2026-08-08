@echo off
setlocal

cd /d "%~dp0"

echo === Japanese-Vocab-Reviser One-Click Sync ===
echo.

set "MSG=%~1"
if "%MSG%"=="" (
    set /p MSG=Commit message (leave blank for auto): 
)
if "%MSG%"=="" (
    set "MSG=sync: %date% %time%"
)

echo.
echo [1/4] Staging changes...
git add -A
if errorlevel 1 goto :error

echo [2/4] Creating commit if needed...
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "%MSG%"
    if errorlevel 1 goto :error
) else (
    echo No staged changes to commit.
)

echo [3/4] Pulling latest from origin/main...
git pull --no-rebase origin main
if errorlevel 1 goto :error

echo [4/4] Pushing to origin/main...
git push origin main
if errorlevel 1 goto :error

echo.
echo Sync completed successfully.
pause
exit /b 0

:error
echo.
echo Sync failed. Resolve the error shown above, then run this script again.
pause
exit /b 1
