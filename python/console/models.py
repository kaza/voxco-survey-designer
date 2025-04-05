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
    required: bool = Field()
    randomize_choices: bool = Field()
    none_of_above: bool = Field()
    alphabetize_choices: bool = Field(default_factory=lambda: False)
    # # Multiple choice specific
    min_selections: Optional[int] = None
    max_selections: Optional[int] = None

    # # Open ended specific
    validation_rules: Optional[Dict[str, str]] = None  # e.g., {"min_length": 10, "max_length": 500}
    
    # # Drop down specific
    placeholder: Optional[str] = None

    # # Numeric specific
    min_value: Optional[float] = None
    max_value: Optional[float] = None
    allow_decimal: bool = Field(default_factory=lambda: False)
    unit: Optional[str] = None
    
    # # Rating specific
    scale_min: int = Field(default_factory=lambda: 1)
    scale_max: int = Field(default_factory=lambda: 5)
    visual_style: str = Field(default_factory=lambda: "stars")  # or "slider"
    scale_labels: Optional[Dict[str, str]] = None  # e.g., {"min": "Poor", "max": "Excellent"}

@dataclass
class Question(BaseModel):
    text: str
    type: QuestionType
    position: int
    question_options: QuestionOptions 
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    options: List[str] = Field(default_factory=list)  # For RADIO, MULTIPLE_CHOICE, DROP_DOWN
    survey_id: Optional[str] = None

    # def __post_init__(self):
    #     # Validate that choice-based questions have options
    #     if self.type in [QuestionType.RADIO, QuestionType.MULTIPLE_CHOICE, QuestionType.DROP_DOWN]:
    #         if not self.options:
    #             raise ValueError(f"Question type {self.type} requires options")
        
    #     # Validate numeric options
    #     if self.type == QuestionType.NUMERIC:
    #         if self.question_options.min_value is not None and self.question_options.max_value is not None:
    #             if self.question_options.min_value > self.question_options.max_value:
    #                 raise ValueError("min_value cannot be greater than max_value")
        
    #     # Validate rating scale
    #     if self.type == QuestionType.RATING:
    #         if self.question_options.scale_min >= self.question_options.scale_max:
    #             raise ValueError("scale_min must be less than scale_max")

@dataclass
class Survey:
    name: str
    description: str
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

