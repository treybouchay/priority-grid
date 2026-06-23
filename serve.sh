#!/bin/sh
# Serve on all network interfaces so phones on the same Wi-Fi can connect.
PORT="${1:-8765}"
cd "$(dirname "$0")"
export PORT
exec python3 serve.py
