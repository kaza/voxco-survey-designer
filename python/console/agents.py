import asyncio
from typing import Optional, List
from agents import Agent, Runner, trace
from .models import Survey, Question, QuestionType, SurveyContext
from .tools import SurveyTools
from . import agent_tools
from .constants import QUESTION_TYPES_INFO

# Create specialized agents
survey_generator = Agent(
    name="Survey Generator",
    instructions=f"""You create new surveys based on user requirements.
    You should:
    1. Ask for survey name and description
    2. Create appropriate questions based on the survey purpose
    3. Validate question types and options
    4. Save the survey after creation
    
    {QUESTION_TYPES_INFO}
    """,
    tools=[
        agent_tools.create_survey,
        agent_tools.add_question,
    ]
)

survey_editor = Agent(
    name="Survey Editor",
    instructions=f"""You modify existing surveys based on user requirements.
    You should:
    1. Load the specified survey
    2. Make requested modifications to questions
    3. Validate changes
    4. Save the survey after modifications
    
    {QUESTION_TYPES_INFO}
    """,
    tools=[
        agent_tools.load_survey,
        agent_tools.edit_question,
        agent_tools.delete_question,
    ]
)

survey_triage = Agent(
    name="Survey Triage",
    instructions="""You are the main coordinator for survey operations.
    You should:
    1. Understand user intent
    2. Route to appropriate agent (generator or editor)
    3. Handle basic survey listing and management
    
    Use list_surveys to show available surveys before routing to the editor.
    Route to:
    - Generator: When user wants to create a new survey
    - Editor: When user wants to modify an existing survey
    """,
    tools=[agent_tools.list_surveys],
    handoffs=[survey_generator, survey_editor],
)

async def handle_survey_request(user_input: str, tools: SurveyTools, context: SurveyContext) -> str:
    """Handle a user's survey-related request."""
    try:
        # Set up tools for function tools to use
        agent_tools.set_tools(tools)
        
        with trace("Survey management workflow"):
            # Route the request through the triage agent
            result = await Runner.run(survey_triage, user_input)
            return result.final_output
    except Exception as e:
        return f"Error handling request: {e}" 