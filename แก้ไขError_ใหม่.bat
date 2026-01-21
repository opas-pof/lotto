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

echo [INFO] กำลังอัพเดท SQLAlchemy เป็นเวอร์ชันล่าสุด...
echo.

%PIP_CMD% install --upgrade --force-reinstall sqlalchemy

if errorlevel 1 (
    echo.
    echo [ERROR] การอัพเดทล้มเหลว
    echo.
    echo [แนะนำ] Python 3.14 อาจจะยังใหม่เกินไป
    echo ลองใช้ Python 3.11 หรือ 3.12 แทน
    pause
    exit /b 1
) else (
    echo.
    echo [SUCCESS] อัพเดทสำเร็จแล้ว!
    echo.
    echo ตอนนี้ลองรันโปรแกรมอีกครั้ง:
    echo Double click ที่ "รันโปรแกรม.bat"
    echo.
    echo ถ้ายังมี error อาจต้องใช้ Python 3.11 แทน 3.14
    echo.
)

pause
