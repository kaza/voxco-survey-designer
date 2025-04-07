import os
from typing import Any, Optional, List, Dict
from mcp.server.fastmcp import FastMCP
from datetime import datetime
from .database import SURVEY_DB
from .models import Survey


mcp = FastMCP("local-zebra-surveys")

@mcp.tool()
async def echo() -> str:
    """just return default greeting
    """
    return f"Echo!"

@mcp.tool()
async def find_surveys(query_text: Optional[str] = None) -> List[Dict[str, str]]:
    """Find surveys by title, returning the top 3 matches.

    Args:
        query_text: Optional text to search for in survey titles.

    Returns:
        A list of dictionaries, each containing 'survey_id' and 'title'.
    """
    results = []
    if query_text:
        query_lower = query_text.lower()
        for survey_id, survey in SURVEY_DB.items():
            if query_lower in survey.title.lower():
                results.append({"survey_id": survey_id, "title": survey.title})
    else:
        # If no query, return the first 3 surveys
        for survey_id, survey in SURVEY_DB.items():
            results.append({"survey_id": survey_id, "title": survey.title})

    # Return only the top 3
    return results[:3]


if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='sse')