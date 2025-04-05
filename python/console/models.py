from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
import uuid
from pydantic import BaseModel, Field

class QuestionType(Enum):
    RADIO = "Radio"
    OPEN_ENDED = "OpenEnded"
    MULTIPLE_CHOICE = "MultipleChoice"
    DROP_DOWN = "DropDown"
    NUMERIC = "Numeric"
    RATING = "Rating"

class QuestionOptions(BaseModel):
    # Common options
    required: bool = Field(description="Whether the question is required to be answered")
    randomize_choices: bool = Field(description="Whether to randomize the order of choices for choice-based questions")
    none_of_above: bool = Field(description="Whether to include a 'None of the above' option for choice-based questions")
    alphabetize_choices: bool = Field(default_factory=lambda: False, description="Whether to alphabetize the choices for choice-based questions")
    
    # Multiple choice specific
    min_selections: Optional[int] = Field(None, description="Minimum number of selections required for multiple choice questions")
    max_selections: Optional[int] = Field(None, description="Maximum number of selections allowed for multiple choice questions")

    # Open ended specific
    validation_rules: Optional[Dict[str, str]] = Field(None, description="Validation rules for open-ended questions, e.g., {'min_length': 10, 'max_length': 500}")
    
    # Drop down specific
    placeholder: Optional[str] = Field(None, description="Placeholder text to display in the dropdown before a selection is made")

    # Numeric specific
    min_value: Optional[float] = Field(None, description="Minimum allowed value for numeric questions")
    max_value: Optional[float] = Field(None, description="Maximum allowed value for numeric questions")
    allow_decimal: bool = Field(default_factory=lambda: False, description="Whether to allow decimal values for numeric questions")
    unit: Optional[str] = Field(None, description="Unit to display with the numeric input, e.g., '$', 'years'")
    
    # Rating specific
    scale_min: int = Field(default_factory=lambda: 1, description="Minimum value for the rating scale")
    scale_max: int = Field(default_factory=lambda: 5, description="Maximum value for the rating scale")
    visual_style: str = Field(default_factory=lambda: "stars", description="Visual style for the rating, either 'stars' or 'slider'")
    scale_labels: Optional[Dict[str, str]] = Field(None, description="Labels for the scale endpoints, e.g., {'min': 'Poor', 'max': 'Excellent'}")

@dataclass
class Question(BaseModel):
    text: str = Field(description="The question text to display to the user")
    type: QuestionType = Field(description="The type of question (RADIO, MULTIPLE_CHOICE, OPEN_ENDED, etc.)")
    position: int = Field(description="The position of the question in the survey")
    question_options: QuestionOptions = Field(description="Options specific to the question type")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the question")
    options: List[str] = Field(default_factory=list, description="List of options for choice-based questions (RADIO, MULTIPLE_CHOICE, DROP_DOWN)")
    survey_id: Optional[str] = Field(None, description="ID of the survey this question belongs to")

    def __post_init__(self):
        # Validate that choice-based questions have options
        if self.type in [QuestionType.RADIO, QuestionType.MULTIPLE_CHOICE, QuestionType.DROP_DOWN]:
            if not self.options:
                raise ValueError(f"Question type {self.type} requires options")
        
        # Validate numeric options
        if self.type == QuestionType.NUMERIC:
            if self.question_options.min_value is not None and self.question_options.max_value is not None:
                if self.question_options.min_value > self.question_options.max_value:
                    raise ValueError("min_value cannot be greater than max_value")
        
        # Validate rating scale
        if self.type == QuestionType.RATING:
            if self.question_options.scale_min >= self.question_options.scale_max:
                raise ValueError("scale_min must be less than scale_max")

@dataclass
class Survey:
    name: str = Field(description="Name of the survey")
    description: str = Field(description="Description of the survey")
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    questions: List[Question] = field(default_factory=list)

    def add_question(self, question: Question) -> None:
        """Add a question to the survey and update its position."""
        question.survey_id = self.id
        question.position = len(self.questions)
        self.questions.append(question)

@dataclass
class SurveyContext:
    current_survey: Optional[Survey] = None
    current_question: Optional[Question] = None
    surveys: List[Survey] = field(default_factory=list)

