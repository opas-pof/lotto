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
echo วันออกรางวัล: จันทร์, พุธ, ศุกร์
echo เวลารัน: 20:30 น. (หลังจากสรุปผลเสร็จ)
echo.

REM สร้าง Task ที่รันทุกวันจันทร์, พุธ, ศุกร์ เวลา 20:30
schtasks /create /tn "%TASK_NAME%" /tr "\"%SCRIPT_PATH%\"" /sc weekly /d MON,WED,FRI /st 20:30 /f >nul 2>&1

if errorlevel 1 (
    echo [ERROR] ไม่สามารถสร้าง Task ได้
    echo.
    echo [วิธีแก้ไข] ต้องรัน Command Prompt แบบ Administrator
    echo.
    echo วิธีทำ:
    echo 1. คลิกขวาที่ Command Prompt
    echo 2. เลือก "Run as administrator"
    echo 3. ไปที่โฟลเดอร์: cd /d "%~dp0"
    echo 4. รันคำสั่งนี้:
    echo    schtasks /create /tn "LotteryScraper" /tr "\"%SCRIPT_PATH%\"" /sc weekly /d MON,WED,FRI /st 20:30
    echo.
) else (
    echo [SUCCESS] สร้าง Task สำเร็จแล้ว!
    echo.
    echo Task จะรันอัตโนมัติ:
    echo   - ทุกวันจันทร์ เวลา 20:30 น.
    echo   - ทุกวันพุธ เวลา 20:30 น.
    echo   - ทุกวันศุกร์ เวลา 20:30 น.
    echo.
    echo ตรวจสอบ Task:
    echo   schtasks /query /tn "%TASK_NAME%"
    echo.
    echo ลบ Task (ถ้าต้องการ):
    echo   schtasks /delete /tn "%TASK_NAME%" /f
    echo.
)

pause
