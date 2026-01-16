@echo off
echo Starting backend server...
start cmd /k "cd /d c:\Users\ALG\Desktop\web dev\backend && npm start"
timeout /t 2 /nobreak > nul
echo Starting frontend server...
start cmd /k "cd /d c:\Users\ALG\Desktop\web dev\AI Voice Assistant with Chat (Copy) && npm run dev"
echo Both servers are starting. Check the new command windows for details.