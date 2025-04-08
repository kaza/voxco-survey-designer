import strawberry
from typing import List, Optional, Dict, Any # Keep Dict and Any for SURVEY_DB structure initially
from mcp.server.fastmcp import FastMCP
# Remove GraphQLRouter import if not using direct ASGI wrapping
# from strawberry.fastapi import GraphQLRouter
from strawberry.printer import print_schema # Import for schema printing
import json # For pretty printing variables

# --- Data and Models (Copied for now, ideally import from shared modules) ---

# Assuming models.py exists with these definitions
# from models import Survey, Block, Question

# Placeholder models if models.py is not accessible
@strawberry.type
class Question:
    id: str
    text: str
    position: int
    # Add other fields as needed, e.g., question_type: str

@strawberry.type
class Block:
    id: str
    position: int
    questions: List[Question]
    # Add other fields as needed

@strawberry.type
class Survey:
    id: str
    title: str
    blocks: List[Block]
    # Add other fields as needed


# Example In-Memory Database (Copied from third.py for initial setup)
# Ideally, this would be imported from a database module
SURVEY_DB: Dict[str, Survey] = {
    "survey1": Survey(
        id="survey1",
        title="Customer Satisfaction Survey",
        blocks=[
            Block(id="b1", position=1, questions=[
                Question(id="q1", text="How satisfied are you?", position=1),
                Question(id="q2", text="Any comments?", position=2),
            ]),
            Block(id="b2", position=2, questions=[
                Question(id="q3", text="Would you recommend us?", position=1),
            ]),
        ]
    ),
    "survey2": Survey(
        id="survey2",
        title="Employee Feedback",
        blocks=[
            Block(id="b3", position=1, questions=[
                Question(id="q4", text="How is your workload?", position=1),
            ]),
        ]
    ),
    # Add more dummy surveys if needed
}

# --- GraphQL Schema Definition ---

@strawberry.type
class Query:
    @strawberry.field
    def surveys(self, title_contains: Optional[str] = None) -> List[Survey]:
        """
        Retrieve a list of surveys. Optionally filter by title.
        """
        all_surveys = list(SURVEY_DB.values())
        if title_contains:
            query_lower = title_contains.lower()
            return [s for s in all_surveys if query_lower in s.title.lower()]
        return all_surveys

    @strawberry.field
    def survey(self, survey_id: str) -> Optional[Survey]:
        """
        Retrieve a single survey by its ID.
        """
        return SURVEY_DB.get(survey_id)

# Create the GraphQL schema
schema = strawberry.Schema(query=Query)

# --- FastMCP Server Setup ---

mcp = FastMCP("graphql-survey-server")

# Dedicated FastMCP tool to execute GraphQL queries
@mcp.tool("graphql_query")
async def execute_graphql_query(query: str, variables: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
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

@mcp.tool("get_graphql_schema")
async def get_graphql_schema() -> str:
    """
    Returns the GraphQL Schema Definition Language (SDL) string.
    The LLM should use this to understand the available queries, types, and fields.
    """
    result = print_schema(schema)
    print(result)
    return result


# Add a simple echo tool for basic testing
@mcp.tool()
async def echo() -> str:
    """Returns a simple greeting."""
    return "GraphQL Server Echo!"


if __name__ == "__main__":
    print("Starting GraphQL Survey Server...")
    # Running the FastMCP server (adjust transport/port as needed)
    mcp.run(transport='sse') # Or http, etc. 