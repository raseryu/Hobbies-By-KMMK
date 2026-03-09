@echo off
cd /d C:\Users\Wigy\Downloads\Hobbies-By-KMMK-wigi-test\groove-gather-main
git init
git remote add origin https://github.com/raseryu/Hobbies-By-KMMK.git
git branch -M wigi-test
git add -A
git commit -m "Updated code"
git push -u origin wigi-test
pause
