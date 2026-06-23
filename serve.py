#!/usr/bin/env python3
"""Static file server with JSON sync API for cross-device task storage."""

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
SYNC_FILE = ROOT / ".priority-grid-sync.json"
PORT = int(os.environ.get("PORT", "8765"))


def read_sync():
    if not SYNC_FILE.exists():
        return {"version": 1, "updatedAt": None}
    try:
        with SYNC_FILE.open(encoding="utf-8") as handle:
            return json.load(handle)
    except (json.JSONDecodeError, OSError):
        return {"version": 1, "updatedAt": None}


def write_sync(payload):
    with SYNC_FILE.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle)


def pick_newer(existing, incoming):
    if not existing or not existing.get("updatedAt"):
        return incoming
    if not incoming or not incoming.get("updatedAt"):
        return existing
    if incoming["updatedAt"] >= existing["updatedAt"]:
        return incoming
    return existing


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        if args and str(args[0]).startswith("GET /api/sync"):
            return
        super().log_message(format, *args)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if urlparse(self.path).path == "/api/sync":
            self._send_json(read_sync())
            return
        super().do_GET()

    def do_PUT(self):
        if urlparse(self.path).path != "/api/sync":
            self.send_error(404)
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            incoming = json.loads(body.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_error(400, "Invalid JSON")
            return

        merged = pick_newer(read_sync(), incoming)
        write_sync(merged)
        self._send_json(merged)

    def _send_json(self, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def main():
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("")
    print(f"  On this Mac:  http://localhost:{PORT}")
    print("  On your phone (same Wi-Fi):")
    for iface in ("en0", "en1"):
        try:
            import subprocess

            ip = subprocess.check_output(["ipconfig", "getifaddr", iface], text=True).strip()
            if ip:
                print(f"    http://{ip}:{PORT}")
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass
    print("")
    print("  Sync API: GET/PUT /api/sync")
    print("")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
