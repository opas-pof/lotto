@echo off
chcp 65001 >nul
echo ========================================
echo ติดตั้ง Dependencies สำหรับโปรเจกต์
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

echo [INFO] กำลังติดตั้ง dependencies...
echo.

%PIP_CMD% install -r requirements.txt

if errorlevel 1 (
    echo.
    echo [ERROR] การติดตั้งล้มเหลว
    pause
    exit /b 1
) else (
    echo.
    echo [SUCCESS] ติดตั้งสำเร็จแล้ว!
    echo.
    echo ตอนนี้สามารถรันโปรแกรมได้โดย:
    echo 1. Double click ที่ไฟล์ "รันโปรแกรม.bat"
    echo 2. หรือพิมพ์ "%PYTHON_CMD% main.py" ใน Command Prompt
    echo.
)

pause
