import strawberry
from typing import List, Optional, Dict, Any # Keep Dict and Any for SURVEY_DB structure initially
from mcp.server.fastmcp import FastMCP
from strawberry.printer import print_schema # Import for schema printing
import json # For pretty printing variables
from gql_schema import schema


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

    # Use the imported schema object here
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
    # Use the imported schema object here
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