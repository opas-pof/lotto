@echo off
chcp 65001 >nul
echo ========================================
echo ตรวจสอบการติดตั้ง Python
echo ========================================
echo.

echo [1/2] กำลังตรวจสอบ Python...
REM ลอง python ก่อน แล้วลอง py ถ้าไม่ได้
python --version >nul 2>&1
if errorlevel 1 (
    py --version >nul 2>&1
    if errorlevel 1 (
        echo [✗] ไม่พบ Python!
        echo.
        echo ========================================
        echo วิธีแก้ไข:
        echo ========================================
        echo 1. ไปที่ https://www.python.org/downloads/
        echo 2. ดาวน์โหลด Python 3.11 หรือสูงกว่า
        echo 3. ติดตั้ง (อย่าลืมติ๊ก "Add Python to PATH")
        echo.
        echo ดูรายละเอียดเพิ่มเติมในไฟล์: วิธีติดตั้งPython.md
        echo.
        set PYTHON_CMD=
        set PIP_CMD=
    ) else (
        echo [✓] พบ Python แล้ว (ใช้ py command)
        py --version
        set PYTHON_CMD=py
        set PIP_CMD=py -m pip
    )
) else (
    echo [✓] พบ Python แล้ว (ใช้ python command)
    python --version
    set PYTHON_CMD=python
    set PIP_CMD=pip
)

echo.
echo [2/2] กำลังตรวจสอบ pip...
if defined PYTHON_CMD (
    %PIP_CMD% --version >nul 2>&1
    if errorlevel 1 (
        echo [✗] ไม่พบ pip!
        echo.
        echo ========================================
        echo วิธีแก้ไข:
        echo ========================================
        echo Python ติดตั้งแล้ว แต่ pip ไม่ทำงาน
        echo ลองติดตั้ง Python ใหม่ และติ๊ก "Add Python to PATH"
        echo.
        echo ดูรายละเอียดเพิ่มเติมในไฟล์: วิธีติดตั้งPython.md
        echo.
        set PYTHON_CMD=
        set PIP_CMD=
    ) else (
        echo [✓] พบ pip แล้ว
        %PIP_CMD% --version
    )
) else (
    echo [✗] ไม่สามารถตรวจสอบ pip ได้ (Python ไม่พบ)
)

echo.
echo ========================================
if errorlevel 1 (
    echo สถานะ: ❌ ยังไม่พร้อมใช้งาน
    echo.
    echo กรุณาติดตั้ง Python ก่อน
) else (
    echo สถานะ: ✅ พร้อมใช้งาน!
    echo.
    echo ตอนนี้สามารถ:
    echo 1. Double click ที่ "ติดตั้งครั้งแรก.bat"
    echo 2. แล้วรัน "รันโปรแกรม.bat"
)

echo.
pause
