@echo off
echo Setting up Git remote and pushing to GitHub...

cd /d "C:\Users\Wigy\Downloads\Hobbies-By-KMMK-wigi-test\groove-gather-main"

REM Initialize git if not exists
if not exist ".git" (
    echo Initializing git repository...
    git init
)

REM Add remote if not exists
git remote -v | findstr "origin" >nul
if %errorlevel% neq 0 (
    echo Adding remote origin...
    git remote add origin https://github.com/raseryu/Hobbies-By-KMMK.git
)

REM Set branch to wigi-test
git branch -M wigi-test

REM Add all files
git add -A

REM Commit changes
git commit -m "Updated code - Hobbies By KMMK"

REM Push to GitHub wigi-test branch
git push -u origin wigi-test

echo Done!
pause
