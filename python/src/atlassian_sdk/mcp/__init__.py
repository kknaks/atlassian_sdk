from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path

from atlassian_sdk.mcp.server import main


def _load_env_file(path: Path) -> None:
    """Parse a .env file and inject into os.environ (does not override existing)."""
    if not path.is_file():
        print(f"Error: env file not found: {path}", file=sys.stderr)
        sys.exit(1)
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        eq = line.find("=")
        if eq == -1:
            continue
        key = line[:eq].strip()
        value = line[eq + 1 :].strip()
        if key not in os.environ:
            os.environ[key] = value


def run() -> None:
    """Entry point for the atlassian-sdk-mcp console script."""
    # Parse --env-file argument
    if "--env-file" in sys.argv:
        idx = sys.argv.index("--env-file")
        if idx + 1 >= len(sys.argv):
            print("Error: --env-file requires a file path argument.", file=sys.stderr)
            sys.exit(1)
        env_path = Path(sys.argv[idx + 1]).resolve()
        _load_env_file(env_path)

    asyncio.run(main())


if __name__ == "__main__":
    run()
