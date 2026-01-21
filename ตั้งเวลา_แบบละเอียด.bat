@echo off
chcp 65001 >nul
echo ========================================
echo ตั้งเวลาให้รันอัตโนมัติ (แบบละเอียด)
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

echo ========================================
echo ข้อมูลการตั้งเวลา
echo ========================================
echo.
echo วันออกรางวัล: จันทร์, พุธ, ศุกร์
echo เวลาถ่ายทอดสด: 20:00 น.
echo เวลาสรุปผลเสร็จ: 20:30 น.
echo เวลารันโปรแกรม: 20:30 น. (หลังจากสรุปผลเสร็จ)
echo.
echo ชื่อ Task: %TASK_NAME%
echo Script: %SCRIPT_PATH%
echo.

echo [INFO] กำลังสร้าง Scheduled Task...
echo.

REM ลบ Task เก่า (ถ้ามี)
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

REM สร้าง Task ใหม่
schtasks /create /tn "%TASK_NAME%" /tr "\"%SCRIPT_PATH%\"" /sc weekly /d MON,WED,FRI /st 20:30 /f >nul 2>&1

if errorlevel 1 (
    echo [ERROR] ไม่สามารถสร้าง Task ได้
    echo.
    echo ========================================
    echo วิธีแก้ไข: ต้องรัน Command Prompt แบบ Administrator
    echo ========================================
    echo.
    echo วิธีทำ:
    echo 1. คลิกขวาที่ Command Prompt
    echo 2. เลือก "Run as administrator"
    echo 3. ไปที่โฟลเดอร์: cd /d "%~dp0"
    echo 4. รันคำสั่งนี้:
    echo.
    echo    schtasks /create /tn "LotteryScraper" /tr "\"%SCRIPT_PATH%\"" /sc weekly /d MON,WED,FRI /st 20:30
    echo.
    pause
    exit /b 1
) else (
    echo [SUCCESS] สร้าง Task สำเร็จแล้ว!
    echo.
    echo ========================================
    echo ตารางเวลารันอัตโนมัติ
    echo ========================================
    echo.
    echo ✅ ทุกวันจันทร์ เวลา 20:30 น.
    echo ✅ ทุกวันพุธ เวลา 20:30 น.
    echo ✅ ทุกวันศุกร์ เวลา 20:30 น.
    echo.
    echo ========================================
    echo คำสั่งที่มีประโยชน์
    echo ========================================
    echo.
    echo ตรวจสอบ Task:
    echo   schtasks /query /tn "%TASK_NAME%"
    echo.
    echo ดูรายละเอียด Task:
    echo   schtasks /query /tn "%TASK_NAME%" /v /fo list
    echo.
    echo รัน Task ทันที (ทดสอบ):
    echo   schtasks /run /tn "%TASK_NAME%"
    echo.
    echo ลบ Task (ถ้าต้องการ):
    echo   schtasks /delete /tn "%TASK_NAME%" /f
    echo.
)

pause
