@echo off
"C:\Program Files\Git\bin\git.exe" -C C:\Users\Luis\.openclaw\workspace\bizright-app add -A
"C:\Program Files\Git\bin\git.exe" -C C:\Users\Luis\.openclaw\workspace\bizright-app commit -m "Persist cashup week in sessionStorage across navigations"
"C:\Program Files\Git\bin\git.exe" -C C:\Users\Luis\.openclaw\workspace\bizright-app push
echo DONE
pause