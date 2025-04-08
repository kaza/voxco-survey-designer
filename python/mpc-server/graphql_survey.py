import strawberry
from typing import List, Optional, Dict, Any # Keep Dict and Any for SURVEY_DB structure initially
from mcp.server.fastmcp import FastMCP
# Remove GraphQLRouter import if not using direct ASGI wrapping
# from strawberry.fastapi import GraphQLRouter
from strawberry.printer import print_schema # Import for schema printing
import json # For pretty printing variables
# Import the shared database instance
from database import SURVEY_DB

# --- Data and Models (Copied for now, ideally import from shared modules) ---

# Assuming models.py exists with these definitions
# from models import Survey, Block, Question

# Placeholder models if models.py is not accessible
@strawberry.type(description="A survey question representing a single item that can be answered by a respondent")
class Question:
    """A survey question representing a single item that can be answered by a respondent"""
    id: str = strawberry.field(description="Unique identifier for the question")
    text: str = strawberry.field(description="The text content of the question shown to respondents")
    position: int = strawberry.field(description="The order position of this question within its parent block")
    # Add other fields as needed, e.g., question_type: str

@strawberry.type(description="A block that groups related questions together within a survey")
class Block:
    """A block that groups related questions together within a survey"""
    id: str = strawberry.field(description="Unique identifier for the block")
    position: int = strawberry.field(description="The order position of this block within its parent survey")
    questions: List[Question] = strawberry.field(description="List of questions contained within this block")
    # Add other fields as needed

@strawberry.type(description="A survey containing blocks of questions to be presented to respondents")
class Survey:
    """A survey containing blocks of questions to be presented to respondents"""
    id: str = strawberry.field(description="Unique identifier for the survey")
    title: str = strawberry.field(description="The title of the survey")
    blocks: List[Block] = strawberry.field(description="List of blocks contained within this survey")
    # Add other fields as needed


# --- GraphQL Schema Definition ---

@strawberry.type(description="Root query object providing access to survey data")
class Query:
    @strawberry.field(
        description="""Retrieve a list of surveys with optional title filtering.
        
Parameters:
- titleContains: Filter surveys to only include those whose title contains this string (case-insensitive)
- titleSearch: Alternative way to search for surveys by title content (case-insensitive)

If both parameters are provided, titleSearch takes precedence.
Returns an empty list if no matching surveys are found."""
    )
    def surveys(
        self, 
        title_contains: Optional[str] = None,
        title_search: Optional[str] = None
    ) -> List[Survey]:
        """
        Retrieve a list of surveys from the database.
        
        Parameters:
        - titleContains: Filter surveys to only include those whose title contains this string (case-insensitive)
        - titleSearch: Alternative way to search for surveys by title content (case-insensitive)
        
        If both parameters are provided, titleSearch takes precedence.
        Returns an empty list if no matching surveys are found.
        """
        all_surveys = list(SURVEY_DB.values())

        if title_search:
            # Simple substring search (case-insensitive)
            search_lower = title_search.lower()
            return [s for s in all_surveys if search_lower in s.title.lower()]
        elif title_contains:
            # Existing exact substring check (case-insensitive)
            # Note: The original implementation was already doing what 'title_search' does.
            # Let's keep 'title_contains' for potential future exact matching needs if desired,
            # but for now, both arguments achieve the same result with this simple logic.
            query_lower = title_contains.lower()
            return [s for s in all_surveys if query_lower in s.title.lower()]
        else:
            # Return all surveys if no filter is provided
            return all_surveys

    @strawberry.field(
        description="""Retrieve a single survey by its unique identifier.
        
Parameters:
- surveyId: The unique identifier of the survey to retrieve

Returns null if no survey with the given ID exists."""
    )
    def survey(
        self,
        survey_id: str
    ) -> Optional[Survey]:
        """
        Retrieve a single survey by its unique identifier.
        
        Parameters:
        - surveyId: The unique identifier of the survey to retrieve
        
        Returns null if no survey with the given ID exists.
        """
        return SURVEY_DB.get(survey_id)

# Create the GraphQL schema
schema = strawberry.Schema(query=Query)

# --- FastMCP Server Setup ---

mcp = FastMCP("graphql-survey-server")

# Dedicated FastMCP tool to execute GraphQL queries
@mcp.tool("graphql_query", description="Execute GraphQL queries against the survey schema")
async def execute_graphql_query(
    query: str, 
    variables: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Executes a GraphQL query against the survey schema.

    Args:
        query: The GraphQL query string.
        variables: Optional dictionary of variables for the query.

    Returns:
        The result of the GraphQL query execution.
    """
    print("--- Executing GraphQL Query ---")
    print(f"Query:\n{query}")
    if variables:
        # Pretty print variables for better readability
        print(f"Variables:\n{json.dumps(variables, indent=2)}")
    else:
        print("Variables: None")
    print("-----------------------------")

    result = await schema.execute(query=query, variable_values=variables)

    # Construct the response dictionary manually
    return_data = {}
    if result.data:
        return_data["data"] = result.data
    if result.errors:
        # Format errors for the response
        return_data["errors"] = [
            strawberry.exceptions.format_error(err) for err in result.errors
        ]

    print("--- Returning Result ---")
    # Pretty print the dictionary for better log readability
    print(json.dumps(return_data, indent=2))
    print("------------------------")

    return return_data # Return the dictionary

@mcp.tool("get_graphql_schema", description="Retrieve the full GraphQL schema definition")
async def get_graphql_schema() -> str:
    """
    Returns the GraphQL Schema Definition Language (SDL) string.
    The LLM should use this to understand the available queries, types, and fields.
    """
    result = print_schema(schema)
    print(result)
    return result


# Add a simple echo tool for basic testing
@mcp.tool(description="Simple echo function for testing the GraphQL server")
async def echo() -> str:
    """Returns a simple greeting."""
    return "GraphQL Server Echo!"


if __name__ == "__main__":
    print("Starting GraphQL Survey Server...")
    # Running the FastMCP server (adjust transport/port as needed)
    mcp.run(transport='sse') # Or http, etc. 