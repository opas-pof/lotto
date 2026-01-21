@echo off
chcp 65001 >nul
echo ========================================
echo ระบบ Scrap ข้อมูลผลหวยจาก laodl.com
echo ========================================
echo.

REM ตรวจสอบว่ามี Python หรือไม่ (ลอง python ก่อน แล้วลอง py)
set PYTHON_CMD=
set PIP_CMD=

python --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python
    set PIP_CMD=pip
    goto :found_python
)

py --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
    set PIP_CMD=py -m pip
    goto :found_python
)

echo [ERROR] ไม่พบ Python!
echo.
echo กรุณาติดตั้ง Python จาก: https://www.python.org/downloads/
echo และติ๊ก "Add Python to PATH" ตอนติดตั้ง
echo.
pause
exit /b 1

:found_python
echo [INFO] พบ Python แล้ว
%PYTHON_CMD% --version
echo.

echo [1/3] กำลังตรวจสอบ dependencies...
%PYTHON_CMD% -c "import requests, sqlalchemy" >nul 2>&1
if errorlevel 1 (
    echo [INFO] กำลังติดตั้ง dependencies...
    %PIP_CMD% install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] ไม่สามารถติดตั้ง dependencies ได้
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependencies พร้อมแล้ว
)

echo.
echo [2/3] กำลังรันโปรแกรม...
echo.

%PYTHON_CMD% main.py

echo.
echo [3/3] เสร็จสิ้น!
echo.
pause
