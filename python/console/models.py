from enum import Enum
from dataclasses import dataclass, field
from typing import List, Optional
import uuid

class QuestionType(Enum):
    RADIO = "Radio"
    OPEN_ENDED = "OpenEnded"
    YES_NO = "YesNo"
    MULTIPLE_CHOICE = "MultipleChoice"
    SINGLE_CHOICE = "SingleChoice"

@dataclass
class Question:
    text: str
    type: QuestionType
    position: int
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    options: List[str] = field(default_factory=list)  # For RADIO, MULTIPLE_CHOICE, SINGLE_CHOICE
    survey_id: Optional[str] = None

    def __post_init__(self):
        # Validate that choice-based questions have options
        if self.type in [QuestionType.RADIO, QuestionType.MULTIPLE_CHOICE, QuestionType.SINGLE_CHOICE]:
            if not self.options:
                raise ValueError(f"Question type {self.type} requires options")

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