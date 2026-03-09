@echo off
echo Setting up Node.js path...

REM Add Node.js to PATH - adjust this path if your Node.js is installed elsewhere
set PATH=%USERPROFILE%\nodejs;%USERPROFILE%\AppData\Roaming\npm;C:\Program Files\nodejs;%PATH%

echo Node version:
node --version

echo npm version:
npm --version

echo.
echo Installing dependencies...
cd /d "C:\Users\Wigy\Downloads\Hobbies-By-KMMK-wigi-test\groove-gather-main"
npm install

echo.
echo Starting development server...
npm run dev

echo.
echo Server stopped. Press any key to exit...
pause >nul

