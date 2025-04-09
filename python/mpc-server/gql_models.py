import strawberry
from typing import List, Optional
import enum # Import enum

# --- Enums ---
@strawberry.enum(description="Direction to move an item within a list")
class MoveDirection(enum.Enum):
    UP = "UP"
    DOWN = "DOWN"

# --- Data Models ---

@strawberry.type(description="A survey question representing a single item that can be answered by a respondent")
class Question:
    id: str = strawberry.field(description="Unique identifier for the question")
    text: str = strawberry.field(description="The text content of the question shown to respondents")
    position: int = strawberry.field(description="The order position of this question within its parent block")
    # Add other fields as needed, e.g., question_type: str

@strawberry.type(description="A block that groups related questions together within a survey")
class Block:
    id: str = strawberry.field(description="Unique identifier for the block")
    position: int = strawberry.field(description="The order position of this block within its parent survey")
    questions: List[Question] = strawberry.field(description="List of questions contained within this block")
    # Add other fields as needed

@strawberry.type(description="A survey containing blocks of questions to be presented to respondents")
class Survey:
    id: str = strawberry.field(description="Unique identifier for the survey")
    title: str = strawberry.field(description="The title of the survey")
    blocks: List[Block] = strawberry.field(description="List of blocks contained within this survey")
    # Add other fields as needed


# --- Input Types for Mutations ---
@strawberry.input(description="Input fields for updating an existing survey. Only provided fields will be updated.")
class UpdateSurveyInput:
    title: Optional[str] = strawberry.field(
        default=strawberry.UNSET,
        description="The new title for the survey. If not provided or null, the title remains unchanged."
    )
    # We can add other updatable fields here later, e.g.:
    # description: Optional[str] = strawberry.field(default=strawberry.UNSET, description="...")

@strawberry.input(description="Input fields for updating an existing block. Only provided fields will be updated.")
class UpdateBlockInput:
    # Currently, no updatable fields directly on the block itself besides position (handled by reorder).
    # Add fields like 'title' here if the Block model is extended later.
    # We keep the input type for consistency and future expansion.
    title: Optional[str] = strawberry.field(
        default=strawberry.UNSET,
        description="The new title for the block. If not provided or null, the title remains unchanged."
    )
    

@strawberry.input(description="Input fields for updating an existing question. Only provided fields will be updated.")
class UpdateQuestionInput:
    text: Optional[str] = strawberry.field(
        default=strawberry.UNSET,
        description="The new text content for the question. If not provided or null, the text remains unchanged."
    )
    block_id: Optional[str] = strawberry.field(
        default=strawberry.UNSET,
        description="The ID of the new block to move this question to. If provided, the question will be moved to the end of the target block's question list."
    )
    # Add other fields like 'question_type' here if needed later. 