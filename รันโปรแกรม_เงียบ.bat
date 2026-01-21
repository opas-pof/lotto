@echo off
chcp 65001 >nul

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

exit /b 1

:found_python
REM ตรวจสอบ dependencies
%PYTHON_CMD% -c "import requests" >nul 2>&1
if errorlevel 1 (
    %PIP_CMD% install -r requirements.txt >nul 2>&1
)

REM รันโปรแกรม (เงียบๆ ไม่แสดงหน้าต่าง)
%PYTHON_CMD% main.py >nul 2>&1

exit /b 0
