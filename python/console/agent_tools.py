from typing import List, Optional, Dict, Any
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
def add_question(survey_id: str, text: str, question_type: str, 
                options: List[str] = None, question_options: Dict[str, Any] = None) -> dict:
    """Add a question to a survey.
    
    Args:
        survey_id: ID of the survey to add the question to
        text: The question text
        question_type: Type of question (Radio, OpenEnded, MultipleChoice, DropDown, Numeric, Rating)
        options: List of options for choice-based questions
        question_options: Dictionary of question-specific options (e.g., required, validation rules)
    """
    question = _tools.add_question(
        survey_id=survey_id,
        text=text,
        question_type=QuestionType(question_type),
        options=options,
        question_options=question_options
    )
    return {
        "id": question.id,
        "text": question.text,
        "type": question.type.value,
        "position": question.position,
        "options": question.options,
        "question_options": {
            "required": question.question_options.required,
            "randomize_choices": question.question_options.randomize_choices,
            "min_selections": question.question_options.min_selections,
            "max_selections": question.question_options.max_selections,
            "none_of_above": question.question_options.none_of_above,
            "validation_rules": question.question_options.validation_rules,
            "placeholder": question.question_options.placeholder,
            "alphabetize_choices": question.question_options.alphabetize_choices,
            "min_value": question.question_options.min_value,
            "max_value": question.question_options.max_value,
            "allow_decimal": question.question_options.allow_decimal,
            "unit": question.question_options.unit,
            "scale_min": question.question_options.scale_min,
            "scale_max": question.question_options.scale_max,
            "visual_style": question.question_options.visual_style,
            "scale_labels": question.question_options.scale_labels
        }
    }

@function_tool
def edit_question(survey_id: str, question_id: str, text: str = None, 
                 question_type: str = None, options: List[str] = None,
                 question_options: Dict[str, Any] = None) -> dict:
    """Edit an existing question.
    
    Args:
        survey_id: ID of the survey containing the question
        question_id: ID of the question to edit
        text: New question text (optional)
        question_type: New question type (optional)
        options: New list of options (optional)
        question_options: New question-specific options (optional)
    """
    question = _tools.edit_question(
        survey_id=survey_id,
        question_id=question_id,
        text=text,
        question_type=QuestionType(question_type) if question_type else None,
        options=options,
        question_options=question_options
    )
    return {
        "id": question.id,
        "text": question.text,
        "type": question.type.value,
        "position": question.position,
        "options": question.options,
        "question_options": {
            "required": question.question_options.required,
            "randomize_choices": question.question_options.randomize_choices,
            "min_selections": question.question_options.min_selections,
            "max_selections": question.question_options.max_selections,
            "none_of_above": question.question_options.none_of_above,
            "validation_rules": question.question_options.validation_rules,
            "placeholder": question.question_options.placeholder,
            "alphabetize_choices": question.question_options.alphabetize_choices,
            "min_value": question.question_options.min_value,
            "max_value": question.question_options.max_value,
            "allow_decimal": question.question_options.allow_decimal,
            "unit": question.question_options.unit,
            "scale_min": question.question_options.scale_min,
            "scale_max": question.question_options.scale_max,
            "visual_style": question.question_options.visual_style,
            "scale_labels": question.question_options.scale_labels
        }
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
                "options": q.options,
                "question_options": {
                    "required": q.question_options.required,
                    "randomize_choices": q.question_options.randomize_choices,
                    "min_selections": q.question_options.min_selections,
                    "max_selections": q.question_options.max_selections,
                    "none_of_above": q.question_options.none_of_above,
                    "validation_rules": q.question_options.validation_rules,
                    "placeholder": q.question_options.placeholder,
                    "alphabetize_choices": q.question_options.alphabetize_choices,
                    "min_value": q.question_options.min_value,
                    "max_value": q.question_options.max_value,
                    "allow_decimal": q.question_options.allow_decimal,
                    "unit": q.question_options.unit,
                    "scale_min": q.question_options.scale_min,
                    "scale_max": q.question_options.scale_max,
                    "visual_style": q.question_options.visual_style,
                    "scale_labels": q.question_options.scale_labels
                }
            }
            for q in survey.questions
        ]
    } 