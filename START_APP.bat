@echo off
echo ==============================================
echo   OST Email Explorer - Starting Application
echo ==============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking backend dependencies...
cd backend

REM Check if venv exists
if not exist "venv\Scripts\activate.bat" (
    echo [INFO] Creating Python virtual environment...
    python -m venv venv
)

echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat

echo [INFO] Installing/updating Python dependencies...
pip install -q --upgrade pip
pip install -q -r requirements.txt

echo [2/4] Checking frontend dependencies...
cd ..\frontend

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [INFO] Installing Node.js dependencies...
    npm install --legacy-peer-deps --silent
)

echo [3/4] Starting backend server...
cd ..\backend
start "OST Email Explorer - Backend" cmd /k "venv\Scripts\activate.bat && uvicorn server:app --host 0.0.0.0 --port 8000"

REM Wait for backend to start
timeout /t 3 /nobreak >nul

echo [4/4] Starting frontend application...
cd ..\frontend
start "OST Email Explorer - Frontend" cmd /k "npm start"

echo.
echo ==============================================
echo   Application started successfully!
echo ==============================================
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000 (will open automatically)
echo.
echo Press any key to close this window...
echo The application will continue running in separate windows.
echo ==============================================
pause >nul

