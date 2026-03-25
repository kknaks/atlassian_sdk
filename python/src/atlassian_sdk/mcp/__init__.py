from __future__ import annotations

import asyncio

from atlassian_sdk.mcp.server import main


def run() -> None:
    """Entry point for the atlassian-sdk-mcp console script."""
    asyncio.run(main())


if __name__ == "__main__":
    run()
