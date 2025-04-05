from agents import Agent

from agent_tools import list_surveys, edit_question, delete_question, create_survey, add_question
# import agent_tools
from constants import QUESTION_TYPES_INFO
from models import SurveyContext

# Create specialized agents first to avoid forward references

question_parser = Agent[SurveyContext](
    name="Question Parser",
    instructions=f"""You are a specialized agent that parses individual survey questions into a structured `Question` object.
    You should:
    1. Analyze the raw question text provided as input.
    2. Identify the most appropriate `QuestionType` enum value (e.g., `QuestionType.RADIO`, `QuestionType.NUMERIC`).
    3. Extract the question text and any options (if applicable).
    4. Determine the correct `position` for the new question based on the current number of questions in the survey (e.g., if 0 questions exist, position is 0).
    5. Construct a `Question` object using the parsed `text`, `type`, `options`, and `position`. Ensure `survey_id` is set from `context.current_survey.id`.
    6. Use the `add_question` tool, passing the fully constructed `Question` object.
    7. After the tool call succeeds, return a confirmation message in the format: "Question '[question.text]' of type '[question.type.value]' created."

    Example:
    Input: "Did you find our website easy to navigate? (Yes / No)"
    Action: Construct `Question(text='Did you find our website easy to navigate?', type=QuestionType.RADIO, options=['Yes', 'No'], position=0, survey_id='xyz')`. Call `add_question(question=...)`.
    Output: "Question 'Did you find our website easy to navigate?' of type 'Radio' created."

    Example:
    Input: "Approximately how many hours per week do you use our platform? (Please enter a number)"
    Action: Construct `Question(text='Approximately how many hours per week do you use our platform?', type=QuestionType.NUMERIC, options=[], position=2, survey_id='abc')`. Call `add_question(question=...)`.
    Output: "Question 'Approximately how many hours per week do you use our platform?' of type 'Numeric' created."

    {QUESTION_TYPES_INFO}
    """,
    tools=[add_question],
    output_type=str
)

survey_parser = Agent[SurveyContext](
    name="Survey Parser",
    instructions=f"""You convert complete natural language survey descriptions into structured survey data.
    You should:
    1. First create a new survey using create_survey
    2. Split the input text into individual questions
    3. For each question:
       - Send the question text to the question_parser agent
       - Receive the structured question data as a JSON string
       - Parse the JSON string and call add_question with the parsed data
    4. After all questions are added, call update_context with the survey ID to register it in the context
    5. Return a simple JSON string with survey information when complete
    
    The input will be a complete survey with multiple questions. You must process each one separately.
    
    {QUESTION_TYPES_INFO}
    """,
    handoffs=[question_parser, question_parser],
    tools=[create_survey],
    output_type=str  # Use string output type instead of Dict
)

survey_generator = Agent[SurveyContext](
    name="Survey Generator",
    instructions=f"""You create new surveys based on user requirements.
    You should:
    1. Ask for survey name and description
    2. Create appropriate questions based on the survey purpose
    3. Validate question types and options
    4. Save the survey after creation
    
    {QUESTION_TYPES_INFO}
    """,
    tools=[create_survey, add_question],
)

survey_editor = Agent[SurveyContext](
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
        edit_question,
        delete_question,
    ]
)

survey_triage = Agent[SurveyContext](
    name="Survey Triage",
    instructions="""You are the main coordinator for survey operations.
    You should:
    1. Understand user intent
    2. Route to appropriate agent (generator, editor, or parser)
    3. Handle basic survey listing and management
    
    Use list_surveys to show available surveys before routing to the editor.
    Route to:
    - Editor: When user wants to modify an existing survey
    - Parser: When user provides a complete survey with multiple questions in text format
    """,
    tools=[list_surveys, create_survey],
    handoffs=[survey_editor],
)

# async def handle_survey_request(user_input: str, tools: SurveyTools, context: SurveyContext) -> str:
#     """Handle a user's survey-related request."""
#     try:
#         # Set up tools for function tools to use
#         set_tools(tools)

#         with trace("Survey management workflow"):
#             # Route the request through the triage agent
#             result = await Runner.run(survey_triage, user_input)
#             return result.final_output
#     except Exception as e:
#         return f"Error handling request: {e}"
