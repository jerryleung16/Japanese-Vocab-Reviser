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
echo [1/5] Staging changes...
git add -A
if errorlevel 1 goto :error

echo [2/5] Checking staged files for protected data...
set "UNSAFE_FILE="
for /f "delims=" %%F in ('git diff --cached --name-only --diff-filter=ACMR') do call :check-protected "%%F"
if defined UNSAFE_FILE (
    call echo Protected file staged: %%UNSAFE_FILE%%
    echo Unstage it and run this script again.
    goto :error
)

echo [3/5] Creating commit if needed...
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "%MSG%"
    if errorlevel 1 goto :error
) else (
    echo No staged changes to commit.
)

echo [4/5] Pulling latest from origin/main...
git pull --no-rebase origin main
if errorlevel 1 goto :error

echo [5/5] Pushing to origin/main...
git push origin main
if errorlevel 1 goto :error

echo.
echo Sync completed successfully.
pause
exit /b 0

:check-protected
set "CHECKED_FILE=%~1"
if /I "%CHECKED_FILE%"==".env" set "UNSAFE_FILE=%CHECKED_FILE%"
if /I "%CHECKED_FILE:~0,5%"==".env." if /I not "%CHECKED_FILE%"==".env.example" set "UNSAFE_FILE=%CHECKED_FILE%"
if /I "%CHECKED_FILE%"=="shared/japanese-vocab-sync.json" set "UNSAFE_FILE=%CHECKED_FILE%"
exit /b 0

:error
echo.
echo Sync failed. Resolve the error shown above, then run this script again.
pause
exit /b 1
