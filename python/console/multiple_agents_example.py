import asyncio
import os
from dotenv import load_dotenv
from survey_agents import Agent, Runner, trace

# Load environment variables from .env file
load_dotenv()

# Create specialized agents
story_generator = Agent(
    name="Story Generator",
    instructions="You generate creative and engaging short stories based on user input.",
)

story_critic = Agent(
    name="Story Critic",
    instructions="You analyze stories and provide constructive feedback on their quality, structure, and engagement.",
)

story_improver = Agent(
    name="Story Improver",
    instructions="You take stories and feedback, and improve the story based on the feedback while maintaining its core elements.",
)

async def main():
    # Check if API key is set
    if not os.getenv("OPENAI_API_KEY"):
        print("Error: OPENAI_API_KEY not found in environment variables.")
        print("Please set your OpenAI API key in the .env file.")
        return

    try:
        # Get user input for the story
        user_prompt = input("Enter a topic for a short story: ")

        # Run the entire workflow in a single trace
        with trace("Story generation and improvement workflow"):
            # Step 1: Generate initial story
            print("\nGenerating story...")
            story_result = await Runner.run(story_generator, user_prompt)
            initial_story = story_result.final_output
            print(f"\nInitial Story:\n{initial_story}")

            # Step 2: Get feedback from critic
            print("\nGetting feedback...")
            critic_result = await Runner.run(story_critic, initial_story)
            feedback = critic_result.final_output
            print(f"\nCritic's Feedback:\n{feedback}")

            # Step 3: Improve the story based on feedback
            print("\nImproving story based on feedback...")
            improver_result = await Runner.run(
                story_improver,
                f"Original Story:\n{initial_story}\n\nFeedback:\n{feedback}"
            )
            improved_story = improver_result.final_output
            print(f"\nImproved Story:\n{improved_story}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 