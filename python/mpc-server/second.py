import os
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

@mcp.resource("config://time")
def get_current_time() -> str:
    """Get the current date and time"""
    return datetime.now().isoformat()

@mcp.resource("files://{directory}/list")
def list_files(directory: str) -> list[str]:
    """List files in the specified directory"""
    return [file for file in os.listdir(directory) if os.path.isfile(os.path.join(directory, file))]

@mcp.resource("users://{user_id}/profile")
def get_user_profile(user_id: str) -> str:
    """Dynamic user data"""
    return f"Profile data for user {user_id}"

if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='sse')