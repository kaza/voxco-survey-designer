import os
from typing import Any
from mcp.server.fastmcp import FastMCP
from datetime import datetime


mcp = FastMCP("local-zebra")

@mcp.tool()
async def echo() -> str:
    """just return default greeting
    """
    return f"Echo!"


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='sse')