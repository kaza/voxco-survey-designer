import os
from typing import Any, Optional, List, Dict
from mcp.server.fastmcp import FastMCP
from database import SURVEY_DB
from models import Survey, Block, Question # Import models


mcp = FastMCP("local-zebra-surveys")

@mcp.tool()
async def echo() -> str:
    """just return default greeting
    """
    return f"Echo!"

@mcp.tool()
async def find_surveys(query_text: Optional[str] = None) -> List[Dict[str, str]]:
    """Find surveys by title, returning the top 3 matches. If no query, return latest 3 surveys.

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

# @mcp.tool()
# async def get_survey_overview(survey_id: str) -> List[Dict[str, Any]]:
#     """Get an overview of a survey (blocks and questions) by its ID.

#     Args:
#         survey_id: The unique identifier of the survey to retrieve.

#     Returns:
#         A list of dictionaries, each representing a block with its questions,
#         or an empty list if the survey_id is not found.
#     """
#     survey = SURVEY_DB.get(survey_id)
#     if not survey:
#         return [] # Return empty list if survey not found

#     detailed_blocks = []
#     # Ensure blocks are sorted by position, just in case
#     sorted_blocks = sorted(survey.blocks, key=lambda b: b.position)

#     for block in sorted_blocks:
#         # Ensure questions are sorted by position
#         sorted_questions = sorted(block.questions, key=lambda q: q.position)
#         question_list = [
#             {
#                 "question_id": q.id,
#                 "text": q.text,
#                 "position": q.position
#             }
#             for q in sorted_questions
#         ]
#         detailed_blocks.append({
#             "block_id": block.id,
#             "position": block.position,
#             "questions": question_list
#         })

#     return detailed_blocks

@mcp.resource("surveys://{survey_id}")
def get_survey_resource(survey_id: str) -> Optional[Survey]:
    """Retrieve the full Survey object by its ID.

    Args:
        survey_id: The unique identifier of the survey.

    Returns:
        The Survey object if found, otherwise None.
    """
    return SURVEY_DB.get(survey_id)

if __name__ == "__main__":
    # Initialize and run the server
    mcp.run(transport='sse')