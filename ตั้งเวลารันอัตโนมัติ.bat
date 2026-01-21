@echo off
chcp 65001 >nul
echo ========================================
echo ตั้งเวลาให้รันอัตโนมัติ (Windows Task Scheduler)
echo ========================================
echo.

REM ตรวจสอบ Python
set PYTHON_CMD=
python --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=python
    goto :found_python
)

py --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
    goto :found_python
)

echo [ERROR] ไม่พบ Python!
pause
exit /b 1

:found_python
echo [INFO] พบ Python แล้ว
%PYTHON_CMD% --version
echo.

set SCRIPT_PATH=%~dp0รันโปรแกรม_เงียบ.bat
set TASK_NAME=LotteryScraper

echo [INFO] กำลังสร้าง Scheduled Task...
echo.
echo ชื่อ Task: %TASK_NAME%
echo Script: %SCRIPT_PATH%
echo.

REM สร้าง Task ที่รันทุก 6 ชั่วโมง
schtasks /create /tn "%TASK_NAME%" /tr "\"%SCRIPT_PATH%\"" /sc hourly /mo 6 /f >nul 2>&1

if errorlevel 1 (
    echo [ERROR] ไม่สามารถสร้าง Task ได้
    echo.
    echo [วิธีแก้ไข] ต้องรัน Command Prompt แบบ Administrator
    echo.
    echo วิธีทำ:
    echo 1. คลิกขวาที่ Command Prompt
    echo 2. เลือก "Run as administrator"
    echo 3. ไปที่โฟลเดอร์: cd /d "%~dp0"
    echo 4. รัน: schtasks /create /tn "LotteryScraper" /tr "\"%SCRIPT_PATH%\"" /sc hourly /mo 6
    echo.
) else (
    echo [SUCCESS] สร้าง Task สำเร็จแล้ว!
    echo.
    echo Task จะรันทุก 6 ชั่วโมงอัตโนมัติ
    echo.
    echo ตรวจสอบ Task:
    echo   schtasks /query /tn "%TASK_NAME%"
    echo.
    echo ลบ Task (ถ้าต้องการ):
    echo   schtasks /delete /tn "%TASK_NAME%" /f
    echo.
)

pause
