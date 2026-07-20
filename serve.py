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


def merge_lists_by_id(existing_list, incoming_list):
    existing_list = existing_list if isinstance(existing_list, list) else []
    incoming_list = incoming_list if isinstance(incoming_list, list) else []
    merged = {}
    order = []
    for item in existing_list:
        item_id = item.get("id")
        if not item_id:
            continue
        merged[item_id] = item
        order.append(item_id)
    for item in incoming_list:
        item_id = item.get("id")
        if not item_id:
            continue
        if item_id not in merged:
            order.append(item_id)
        merged[item_id] = item
    return [merged[item_id] for item_id in order]


def merge_dicts(existing, incoming):
    existing = existing if isinstance(existing, dict) else {}
    incoming = incoming if isinstance(incoming, dict) else {}
    keys = set(existing) | set(incoming)
    return {key: incoming.get(key, existing.get(key)) for key in keys}


def merge_payload(existing, incoming):
    if not existing or not existing.get("updatedAt"):
        return incoming
    if not incoming or not incoming.get("updatedAt"):
        return existing

    newer = incoming if incoming["updatedAt"] >= existing["updatedAt"] else existing
    older = existing if newer is incoming else incoming

    older_custom_tasks = older.get("customTasks") if isinstance(older.get("customTasks"), dict) else {}
    newer_custom_tasks = newer.get("customTasks") if isinstance(newer.get("customTasks"), dict) else {}
    custom_task_keys = set(older_custom_tasks) | set(newer_custom_tasks)
    merged_custom_tasks = {
        key: merge_lists_by_id(older_custom_tasks.get(key), newer_custom_tasks.get(key))
        for key in custom_task_keys
    }

    older_custom_brain = older.get("customBrainDump") if isinstance(older.get("customBrainDump"), dict) else {}
    newer_custom_brain = newer.get("customBrainDump") if isinstance(newer.get("customBrainDump"), dict) else {}
    custom_brain_keys = set(older_custom_brain) | set(newer_custom_brain)
    merged_custom_brain = {
        key: merge_lists_by_id(older_custom_brain.get(key), newer_custom_brain.get(key))
        for key in custom_brain_keys
    }

    merged = {
        "version": max(existing.get("version", 1), incoming.get("version", 1)),
        "updatedAt": max(existing["updatedAt"], incoming["updatedAt"]),
        "work": merge_lists_by_id(older.get("work"), newer.get("work")),
        "home": merge_lists_by_id(older.get("home"), newer.get("home")),
        "brainDumpWork": merge_lists_by_id(older.get("brainDumpWork"), newer.get("brainDumpWork")),
        "brainDumpHome": merge_lists_by_id(older.get("brainDumpHome"), newer.get("brainDumpHome")),
        "customContexts": merge_lists_by_id(older.get("customContexts"), newer.get("customContexts")),
        "customTasks": merged_custom_tasks,
        "customBrainDump": merged_custom_brain,
        "plans": merge_dicts(older.get("plans"), newer.get("plans")),
        "nextWeek": merge_dicts(older.get("nextWeek"), newer.get("nextWeek")),
        "forgetIt": merge_dicts(
            older.get("forgetIt") or older.get("nextWeek"),
            newer.get("forgetIt") or newer.get("nextWeek"),
        ),
    }
    return merged


def pick_newer(existing, incoming):
    return merge_payload(existing, incoming)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        if args and str(args[0]).startswith("GET /api/sync"):
            return
        super().log_message(format, *args)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        path = urlparse(self.path).path.lower()
        # Phones aggressively cache the shell/assets; keep HTML/JS/CSS fresh after deploys.
        if path.endswith((".html", ".js", ".css")) or path in ("", "/"):
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
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


def get_local_ips():
    ips = []
    seen = set()
    for iface in ("en0", "en1", "en2", "bridge100"):
        try:
            import subprocess

            ip = subprocess.check_output(["ipconfig", "getifaddr", iface], text=True).strip()
            if ip and ip not in seen:
                seen.add(ip)
                ips.append(ip)
        except (subprocess.CalledProcessError, FileNotFoundError):
            pass
    return ips


def main():
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print("")
    print(f"  On this Mac:  http://localhost:{PORT}")
    ips = get_local_ips()
    if ips:
        print("  On your phone (same network / hotspot):")
        for ip in ips:
            print(f"    http://{ip}:{PORT}")
    else:
        print("  On your phone: connect Mac + phone to the same network, then use this Mac's IP.")
    print("")
    print("  Sync API: GET/PUT /api/sync")
    print("  iPhone hotspot: keep hotspot ON, Mac joins it, open the URL above on the iPhone.")
    print("")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
