#!/usr/bin/env python3
"""Standalone launcher for Claude Monitor backend."""
import sys
import os

# PyInstaller로 패키징된 경우 _MEIPASS 사용
if getattr(sys, 'frozen', False):
    base_path = sys._MEIPASS
    os.chdir(base_path)
else:
    base_path = os.path.dirname(os.path.abspath(__file__))

sys.path.insert(0, base_path)

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=port,
        log_level="info",
    )
