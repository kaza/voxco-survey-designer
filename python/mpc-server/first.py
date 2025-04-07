from typing import Any
import httpx
from mcp.server.fastmcp import FastMCP
from datetime import datetime

# Initialize FastMCP server
mcp = FastMCP("local-zebra")

@mcp.tool()
async def hello(who: str) -> str:
    """Get greetings

    Args:
        who: whom to greet
    """
    return f"Hello, {who}"

@mcp.tool()
def get_current_time(timezone: str = "UTC") -> str:
    """Get the current date and time.

    Args:
        timezone: Timezone identifier (defaults to UTC)
    """
    # This is a simplified version - in a real implementation,
    # you might want to use pytz or similar library to handle timezones properly
    current_time = datetime.now()
    if timezone.lower() == "utc":
        current_time = datetime.utcnow()

    return f"Current time ({timezone}): {current_time.strftime('%Y-%m-%d %H:%M:%S')}"


@mcp.tool()
def get_timestamp() -> int:
    """Get the current Unix timestamp (seconds since epoch)."""
    return int(datetime.now().timestamp())


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='sse')