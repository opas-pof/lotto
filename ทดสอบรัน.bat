@echo off
chcp 65001 >nul
echo ========================================
echo ทดสอบ Python และ pip
echo ========================================
echo.

echo [ทดสอบ 1] ตรวจสอบ python...
python --version 2>nul
if errorlevel 1 (
    echo [✗] python ไม่ทำงาน
) else (
    echo [✓] python ทำงานได้
)

echo.
echo [ทดสอบ 2] ตรวจสอบ py...
py --version 2>nul
if errorlevel 1 (
    echo [✗] py ไม่ทำงาน
) else (
    echo [✓] py ทำงานได้
)

echo.
echo [ทดสอบ 3] ตรวจสอบ pip...
pip --version 2>nul
if errorlevel 1 (
    echo [✗] pip ไม่ทำงาน
) else (
    echo [✓] pip ทำงานได้
)

echo.
echo [ทดสอบ 4] ตรวจสอบ py -m pip...
py -m pip --version 2>nul
if errorlevel 1 (
    echo [✗] py -m pip ไม่ทำงาน
) else (
    echo [✓] py -m pip ทำงานได้
)

echo.
echo ========================================
echo สรุป:
echo ========================================
echo.

if exist "%TEMP%\python_test.txt" del "%TEMP%\python_test.txt"

python --version >"%TEMP%\python_test.txt" 2>&1
if not errorlevel 1 (
    pip --version >nul 2>&1
    if not errorlevel 1 (
        echo [แนะนำ] ใช้: python และ pip
        goto :end
    )
)

py --version >"%TEMP%\python_test.txt" 2>&1
if not errorlevel 1 (
    py -m pip --version >nul 2>&1
    if not errorlevel 1 (
        echo [แนะนำ] ใช้: py และ py -m pip
        goto :end
    )
)

echo [✗] ไม่พบ Python ที่ใช้งานได้
echo.
echo กรุณาติดตั้ง Python จาก: https://www.python.org/downloads/
echo และติ๊ก "Add Python to PATH" ตอนติดตั้ง

:end
echo.
pause
