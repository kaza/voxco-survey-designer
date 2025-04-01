import asyncio
import os
from dotenv import load_dotenv
from agents import Agent, Runner

# Load environment variables from .env file
load_dotenv()

async def main():
    # Check if API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in environment variables.")
        print("Please set your OpenAI API key in the .env file.")
        return

    # Create a simple agent
    agent = Agent(
        name="Hello World Agent",
        instructions="You are a simple agent that responds with friendly greetings.",
    )

    try:
        # Run the agent with a simple message
        result = await Runner.run(agent, "Say hello to the world!")
        print(result.final_output)
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 