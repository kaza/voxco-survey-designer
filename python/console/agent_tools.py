from typing import List, Optional
from agents import function_tool
from .models import Survey, Question, QuestionType
from .tools import SurveyTools

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
def create_survey(name: str, description: str) -> dict:
    """Create a new survey."""
    survey = _tools.create_survey(name=name, description=description)
    return {
        "id": survey.id,
        "name": survey.name,
        "description": survey.description
    }

@function_tool
def add_question(survey_id: str, text: str, question_type: str, options: List[str] = None) -> dict:
    """Add a question to a survey."""
    question = _tools.add_question(
        survey_id=survey_id,
        text=text,
        question_type=QuestionType(question_type),
        options=options
    )
    return {
        "id": question.id,
        "text": question.text,
        "type": question.type.value,
        "position": question.position,
        "options": question.options
    }

@function_tool
def edit_question(survey_id: str, question_id: str, text: str = None, 
                 question_type: str = None, options: List[str] = None) -> dict:
    """Edit an existing question."""
    question = _tools.edit_question(
        survey_id=survey_id,
        question_id=question_id,
        text=text,
        question_type=QuestionType(question_type) if question_type else None,
        options=options
    )
    return {
        "id": question.id,
        "text": question.text,
        "type": question.type.value,
        "position": question.position,
        "options": question.options
    }

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
    return {
        "id": survey.id,
        "name": survey.name,
        "description": survey.description,
        "questions": [
            {
                "id": q.id,
                "text": q.text,
                "type": q.type.value,
                "position": q.position,
                "options": q.options
            }
            for q in survey.questions
        ]
    } 