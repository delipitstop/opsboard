@echo off
cd C:\Users\Luis\.openclaw\workspace\bizright-app
git init 2>nul
git add .
git commit -m "Initial OpsBoard setup"
git remote remove origin 2>nul
git remote add origin https://github.com/delipitstop/opsboard.git
git branch -M main
git push -u origin main
echo DONE
pause