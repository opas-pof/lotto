@echo off
chcp 65001 >nul
echo ========================================
echo แก้ไข Error - อัพเดท SQLAlchemy
echo ========================================
echo.

REM ตรวจสอบ Python
set PYTHON_CMD=
python --version >nul 2>&1
if not errorlevel 1 (
    pip --version >nul 2>&1
    if not errorlevel 1 (
        set PYTHON_CMD=python
        set PIP_CMD=pip
        goto :found_python
    )
)

py --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
    set PIP_CMD=py -m pip
    goto :found_python
)

echo [ERROR] ไม่พบ Python!
pause
exit /b 1

:found_python
echo [INFO] พบ Python แล้ว
%PYTHON_CMD% --version
echo.

echo [INFO] กำลังอัพเดท SQLAlchemy...
echo.

%PIP_CMD% install --upgrade sqlalchemy

if errorlevel 1 (
    echo.
    echo [ERROR] การอัพเดทล้มเหลว
    pause
    exit /b 1
) else (
    echo.
    echo [SUCCESS] อัพเดทสำเร็จแล้ว!
    echo.
    echo ตอนนี้ลองรันโปรแกรมอีกครั้ง:
    echo Double click ที่ "รันโปรแกรม.bat"
    echo.
)

pause
