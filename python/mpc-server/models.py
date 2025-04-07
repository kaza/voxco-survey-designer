from pydantic import BaseModel, Field
from typing import List

class Question(BaseModel):
    """Represents a single question within a survey block."""
    id: str = Field(..., description="Unique identifier for the question.")
    text: str = Field(..., description="The text content of the question.")
    position: int = Field(..., description="The display order of the question within its block (0-indexed).")

class Block(BaseModel):
    """Represents a block of questions within a survey."""
    id: str = Field(..., description="Unique identifier for the block.")
    position: int = Field(..., description="The display order of the block within the survey (0-indexed).")
    questions: List[Question] = Field(default_factory=list, description="List of questions contained in this block.")

class Survey(BaseModel):
    """Represents the overall survey structure."""
    id: str = Field(..., description="Unique identifier for the survey.")
    title: str = Field(..., description="The title of the survey.")
    blocks: List[Block] = Field(default_factory=list, description="List of blocks contained in this survey.") 