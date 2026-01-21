@echo off
chcp 65001 >nul
echo ========================================
echo ดูข้อมูลผลหวยที่ scrap มา
echo ========================================
echo.

REM ตรวจสอบ Python
set PYTHON_CMD=
python --version >nul 2>&1
if not errorlevel 1 (
    pip --version >nul 2>&1
    if not errorlevel 1 (
        set PYTHON_CMD=python
        goto :found_python
    )
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
echo [INFO] กำลังแสดงข้อมูลผลหวย...
echo.

%PYTHON_CMD% view_data.py

echo.
pause
