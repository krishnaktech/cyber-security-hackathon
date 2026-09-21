@echo off
echo =======================================================
echo   TraceGrid - Push to GitHub Helper
echo =======================================================
echo.

:: Check if git is installed
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check if remote already exists
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo No GitHub remote URL found.
    echo.
    set /p REPO_URL="Enter your GitHub Repository URL (e.g., https://github.com/username/repo.git): "
    if "%REPO_URL%"=="" (
        echo [ERROR] No URL provided. Exiting.
        pause
        exit /b 1
    )
    git remote add origin %REPO_URL%
    echo Added remote origin: %REPO_URL%
) else (
    echo Remote origin already configured:
    git remote get-url origin
)

echo.
echo Staging project files...
git add .

echo Committing files...
git commit -m "Initial commit - TRACEGRID forensic intelligence platform" 2>nul

echo.
echo Pushing branch 'main' to GitHub...
git branch -M main
git push -u origin main

if errorlevel 1 (
    echo.
    echo [NOTE] If this is your first time connecting, you may need to sign in to GitHub in the prompt.
    echo Or if the remote repository was created with a README or license, run:
    echo   git pull origin main --allow-unrelated-histories
    echo   git push -u origin main
) else (
    echo.
    echo =======================================================
    echo   SUCCESS! All project files uploaded to GitHub.
    echo =======================================================
)

echo.
pause
