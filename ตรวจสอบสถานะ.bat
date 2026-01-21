@echo off
chcp 65001 >nul
echo ========================================
echo ตรวจสอบสถานะโปรแกรม
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

echo [✗] ไม่พบ Python!
pause
exit /b 1

:found_python
echo [✓] พบ Python
%PYTHON_CMD% --version
echo.

echo [1/3] ตรวจสอบ dependencies...
%PYTHON_CMD% -c "import requests, sqlalchemy" >nul 2>&1
if errorlevel 1 (
    echo [✗] Dependencies ยังไม่ได้ติดตั้ง
    echo.
    echo [แนะนำ] Double click "ติดตั้งครั้งแรก.bat"
) else (
    echo [✓] Dependencies พร้อมแล้ว
)

echo.
echo [2/3] ตรวจสอบไฟล์ database...
if exist "lottery.db" (
    echo [✓] พบไฟล์ lottery.db
    for %%A in (lottery.db) do echo    ขนาด: %%~zA bytes
) else (
    echo [✗] ยังไม่มีไฟล์ lottery.db
    echo    (ต้องรันโปรแกรมให้สำเร็จก่อน)
)

echo.
echo [3/3] ตรวจสอบข้อมูลใน database...
%PYTHON_CMD% -c "from database import DatabaseManager; from sqlalchemy import func; from database import LotteryResult; db = DatabaseManager(); count = db.session.query(func.count(LotteryResult.id)).scalar(); print(f'[✓] พบข้อมูล {count} รายการ' if count > 0 else '[✗] ยังไม่มีข้อมูล'); db.close()" 2>nul
if errorlevel 1 (
    echo [✗] ไม่สามารถตรวจสอบได้ (อาจมี error)
)

echo.
echo ========================================
echo สรุป:
echo ========================================
echo.

if exist "lottery.db" (
    echo [สถานะ] มีไฟล์ database แล้ว
    echo [ขั้นตอนต่อไป] Double click "ดูข้อมูล.bat"
) else (
    echo [สถานะ] ยังไม่มีข้อมูล
    echo [ขั้นตอนต่อไป] 
    echo   1. Double click "แก้ไขError_ใหม่.bat" (ถ้ามี error)
    echo   2. Double click "รันโปรแกรม.bat"
    echo   3. รอให้รันสำเร็จ (ต้องไม่มี error)
    echo   4. Double click "ดูข้อมูล.bat"
)

echo.
pause
