from typing import List, Optional, Dict, Any
import logging

from agents import function_tool, RunContextWrapper

from models import Survey, Question, QuestionType, SurveyContext
from tools import SurveyTools

# Set up logging
logger = logging.getLogger(__name__)

# Global tools instance - will be set by main.py
_tools: Optional[SurveyTools] = None

def set_tools(tools: SurveyTools):
    """Set the tools instance for use by the function tools."""
    global _tools
    _tools = tools

@function_tool
def list_surveys() -> List[dict]:
    """List all available surveys."""
    surveys = _tools.list_surveys()
    return [{"id": s.id, "name": s.name, "description": s.description} for s in surveys]

@function_tool
def create_survey(wrapper: RunContextWrapper[SurveyContext], name: str, description: str) -> str:
    """Create a new survey."""
    
    try:
        logger.debug(f"### Creating new survey with name: '{name}' and description: '{description}'")
        survey = _tools.create_survey(name=name, description=description)
        
        logger.debug(f"Survey created with ID: {survey.id}")
        logger.debug(f"Current surveys count: {len(_tools.list_surveys())}")
        
        if wrapper is not None and wrapper.context is not None:
            logger.debug(f"Adding survey to context and setting as current survey")
            context = wrapper.context
            context.surveys.append(survey)
            context.current_survey = survey
        else:
            logger.warning(f"### WARNING: Could not update context with survey {survey.id}")
            # Decide if this should be an error or just a warning

        return f"Survey '{survey.name}' (ID: {survey.id}) created successfully."

    except Exception as e:
        logger.error(f"Error creating survey '{name}': {str(e)}")
        return f"Failed to create survey '{name}'. Error: {str(e)}"

@function_tool
def add_question(wrapper: RunContextWrapper[SurveyContext], question: Question) -> str:
    """Add a pre-generated question to a survey.
    
    This can be used when a question is generated and needs to be stored to the database and context.
    
    Args:
        wrapper: Context wrapper for updating the context
        question: The Question object to add
        
    Returns:
        A message indicating success
        
    Raises:
        ValueError: If the context in wrapper is None
    """
    try:
        if wrapper is None or wrapper.context is None:
            raise ValueError("Context cannot be None. Must provide a valid SurveyContext.")
        
        context = wrapper.context
        logger.info(f"add_question: {question.id}  {question.text}  {question.type} ")
        context.current_survey.add_question(question)
        
        return f"Question '{question.text}' of type '{question.type.value}' successfully added to survey and stored in database."
        
    except Exception as e:
        logger.error(f"Error adding question: {str(e)}")
        return f"Failed to add question: {str(e)}"

def xxx_old_add_question(wrapper: RunContextWrapper[SurveyContext], survey_id: str, text: str, 
                question_type: str, options: List[str] = None) -> dict:
    """Add a question to a survey.
    
    Args:
        wrapper: Context wrapper for updating the context
        survey_id: ID of the survey to add the question to
        text: The question text
        question_type: Type of question (Radio, OpenEnded, MultipleChoice, DropDown, Numeric, Rating)
        options: List of options for choice-based questions
    """
    logger.debug(f"### Adding question to survey {survey_id}: '{text}'")
    
    # Create basic question options
    question_options = {
        "required": True,
        "randomize_choices": False
    }
    
    question = _tools.add_question(
        survey_id=survey_id,
        text=text,
        question_type=QuestionType(question_type),
        options=options,
        question_options=question_options
    )
    
    # Convert to simple dictionary
    result = {
        "id": question.id,
        "text": question.text,
        "type": question.type.value,
        "position": question.position,
        "options": question.options
    }
    
    # Update the context if provided
    if wrapper is not None and wrapper.context is not None:
        context = wrapper.context
        if context.current_survey and context.current_survey.id == survey_id:
            context.current_survey = _tools.load_survey(survey_id)
    return result

@function_tool
def edit_question(survey_id: str, question_id: str, text: str = None, 
                 question_type: str = None, options: List[str] = None) -> dict:
    """Edit an existing question.
    
    Args:
        survey_id: ID of the survey containing the question
        question_id: ID of the question to edit
        text: New question text (optional)
        question_type: New question type (optional)
        options: New list of options (optional)
    """
    # Simple question options
    question_options = None
    
    question = _tools.edit_question(
        survey_id=survey_id,
        question_id=question_id,
        text=text,
        question_type=QuestionType(question_type) if question_type else None,
        options=options,
        question_options=question_options
    )
    
    # Convert to simple dictionary
    result = {
        "id": question.id,
        "text": question.text,
        "type": question.type.value,
        "position": question.position,
        "options": question.options
    }
    
    return result

@function_tool
def delete_question(survey_id: str, question_id: str) -> bool:
    """Delete a question from a survey."""
    return _tools.delete_question(survey_id=survey_id, question_id=question_id)

@function_tool
def load_survey(survey_id: str) -> dict:
    """Load a survey by ID."""
    survey = _tools.load_survey(survey_id)
    if not survey:
        return None
    
    # Convert to simple dictionary
    result = {
        "id": survey.id,
        "name": survey.name,
        "description": survey.description,
        "questions": []
    }
    
    # Convert questions to simple dictionaries
    for q in survey.questions:
        question_dict = {
            "id": q.id,
            "text": q.text,
            "type": q.type.value,
            "position": q.position,
            "options": q.options
        }
        
        result["questions"].append(question_dict)
    
    return result

@function_tool
def question_structure_validator(question_data: str) -> str:
    """Validate the structure of a parsed question.
    
    Args:
        question_data: JSON string containing the parsed question data with fields:
            - text: Question text
            - type: Question type
            - options: List of options (if applicable)
    
    Returns:
        JSON string containing:
            - is_valid: Boolean indicating if the structure is valid
            - errors: List of error messages (if any)
            - suggestions: List of suggestions for improvement (if any)
    """
    import json
    
    try:
        data = json.loads(question_data) if isinstance(question_data, str) else question_data
    except:
        return json.dumps({
            "is_valid": False,
            "errors": ["Invalid JSON provided"],
            "suggestions": []
        })
    
    errors = []
    suggestions = []
    
    # Validate required fields
    if not data.get("text"):
        errors.append("Question text is required")
    
    if not data.get("type"):
        errors.append("Question type is required")
    else:
        try:
            question_type = QuestionType(data["type"])
        except ValueError:
            errors.append(f"Invalid question type: {data['type']}")
    
    # Validate options based on question type
    if data.get("type") in ["RADIO", "MULTIPLE_CHOICE", "DROP_DOWN"]:
        if not data.get("options"):
            errors.append(f"Options are required for {data['type']} type questions")
        elif len(data["options"]) < 2:
            errors.append(f"At least 2 options are required for {data['type']} type questions")
    
    return json.dumps({
        "is_valid": len(errors) == 0,
        "errors": errors,
        "suggestions": suggestions
    })

