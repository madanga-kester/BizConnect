#!/usr/bin/env python3
"""Create and verify the Stage 7 source ZIP without build output or local secrets."""
from __future__ import annotations

import argparse
import hashlib
import os
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PREFIX = "Mabiz_stage7_source"
SKIP_DIRS = {
    ".git", ".expo", ".pnpm-store", "node_modules", "dist", "web-build", "coverage",
    "TestResults", "test-results", "playwright-report", ".cache", "bin", "obj", "App_Data",
}
SKIP_SUFFIXES = {".dll", ".pdb", ".db", ".sqlite", ".sqlite3", ".log", ".trx", ".tsbuildinfo", ".pyc"}
SAFE_ENV_TEMPLATES = {".env.example", ".env.backend.example"}
REQUIRED_FILES = {
    "package.json",
    "pnpm-lock.yaml",
    "app/notifications.tsx",
    "app/notification-settings.tsx",
    "app/(tabs)/notifications.tsx",
    "components/notification-sync.tsx",
    "lib/api/push-registration.ts",
    "src/Mabiz.Infrastructure/Persistence/Migrations/20261113035329_Stage7Notifications.cs",
    "tests/Mabiz.IntegrationTests/Stage7NotificationApiTests.cs",
    "tests/Mabiz.UnitTests/Stage7PushProviderTests.cs",
    "scripts/stage6_signalr_smoke.mjs",
    "docs/STAGE7_NOTIFICATIONS.md",
    "STAGE7_IMPLEMENTATION_REPORT.md",
}


def skip_file(path: Path, rel: Path) -> bool:
    name = path.name
    if name in {".DS_Store", "Thumbs.db"}:
        return True
    if path.suffix.lower() in SKIP_SUFFIXES or name.endswith((".zip", ".tar.gz", ".tgz")):
        return True
    if name.startswith(".env") and name not in SAFE_ENV_TEMPLATES:
        return True
    if name in {"secrets.json", "launchSettings.user.json"} or name.endswith((".user", ".suo")):
        return True
    return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=ROOT.parent / "Mabiz_stage7_source.zip")
    args = parser.parse_args()
    output = args.output.expanduser().resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for current, dirs, files in os.walk(ROOT):
            current_path = Path(current)
            rel_dir = current_path.relative_to(ROOT)
            dirs[:] = sorted(name for name in dirs if name not in SKIP_DIRS and not name.startswith("."))
            for filename in sorted(files):
                source = current_path / filename
                rel = source.relative_to(ROOT)
                if skip_file(source, rel) or source.is_symlink():
                    continue
                archive.write(source, Path(PREFIX) / rel)

    with zipfile.ZipFile(output, "r") as archive:
        bad_file = archive.testzip()
        if bad_file:
            raise SystemExit(f"ZIP integrity check failed at {bad_file}")
        names = set(archive.namelist())
        archived_files = {name[len(PREFIX) + 1:] for name in names if name.startswith(PREFIX + "/")}
        missing = sorted(REQUIRED_FILES - archived_files)
        if missing:
            raise SystemExit("ZIP is missing required files: " + ", ".join(missing))
        forbidden = [name for name in names if any(part in SKIP_DIRS for part in Path(name).parts)]
        if forbidden:
            raise SystemExit("ZIP contains excluded build/runtime paths: " + ", ".join(forbidden[:5]))
        if any(Path(name).name not in SAFE_ENV_TEMPLATES and Path(name).name.startswith(".env") for name in names):
            raise SystemExit("ZIP contains a non-template .env file")

    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    print(f"Created: {output}")
    print(f"Files: {len(archived_files)}")
    print(f"Size: {output.stat().st_size} bytes")
    print(f"SHA-256: {digest}")
    print("ZIP integrity and required-file checks: passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
