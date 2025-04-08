import strawberry
from typing import List, Optional

# Import shared database and models/enums
from database import SURVEY_DB
from gql_models import (Question, Block, Survey, 
                       UpdateSurveyInput, UpdateBlockInput, UpdateQuestionInput,
                       MoveDirection) # Import MoveDirection




@strawberry.type(description="Root query object providing access to survey data")
class Query:
    @strawberry.field(
        description="""Retrieve a list of surveys with optional title filtering.
        
Parameters:
- titleContains: Filter surveys to only include those whose title contains this string (case-insensitive)
- titleSearch: Alternative way to search for surveys by title content (case-insensitive)

If both parameters are provided, titleSearch takes precedence.
Returns an empty list if no matching surveys are found."""
    )
    def surveys(
        self,
        title_contains: Optional[str] = None,
        title_search: Optional[str] = None
    ) -> List[Survey]:
        """
        Retrieve a list of surveys from the database.
        
        Parameters:
        - titleContains: Filter surveys to only include those whose title contains this string (case-insensitive)
        - titleSearch: Alternative way to search for surveys by title content (case-insensitive)
        
        If both parameters are provided, titleSearch takes precedence.
        Returns an empty list if no matching surveys are found.
        """
        all_surveys = list(SURVEY_DB.values())

        if title_search:
            # Simple substring search (case-insensitive)
            search_lower = title_search.lower()
            return [s for s in all_surveys if search_lower in s.title.lower()]
        elif title_contains:
            # Existing exact substring check (case-insensitive)
            # Note: The original implementation was already doing what 'title_search' does.
            # Let's keep 'title_contains' for potential future exact matching needs if desired,
            # but for now, both arguments achieve the same result with this simple logic.
            query_lower = title_contains.lower()
            return [s for s in all_surveys if query_lower in s.title.lower()]
        else:
            # Return all surveys if no filter is provided
            return all_surveys

    @strawberry.field(
        description="""Retrieve a single survey by its unique identifier.
        
Parameters:
- surveyId: The unique identifier of the survey to retrieve

Returns null if no survey with the given ID exists."""
    )
    def survey(
        self,
        survey_id: str
    ) -> Optional[Survey]:
        """
        Retrieve a single survey by its unique identifier.
        
        Parameters:
        - surveyId: The unique identifier of the survey to retrieve
        
        Returns null if no survey with the given ID exists.
        """
        return SURVEY_DB.get(survey_id)

# --- Add the Mutation Type --- 
@strawberry.type(description="Root mutation object for modifying survey data")
class Mutation:
    @strawberry.field(
        description="""Create a new survey with a given title.
        
Parameters:
- title: The title for the new survey.

Returns the newly created Survey object."""
    )
    def create_survey(
        self,
        title: str
    ) -> Survey:
        """
        Creates a new survey and adds it to the database.
        
        Parameters:
        - title: The title for the new survey.
        
        Returns the newly created Survey object.
        """
        # Basic ID generation (ensure it's unique for the session)
        new_id = f"survey_{len(SURVEY_DB) + 1}"
        
        # Handle potential ID collisions if surveys are deleted (simple fix for now)
        while new_id in SURVEY_DB:
            new_id = f"survey_{int(new_id.split('_')[1]) + 1}"

        new_survey = Survey(
            id=new_id,
            title=title,
            blocks=[] # New surveys start with no blocks
        )
        SURVEY_DB[new_id] = new_survey
        print(f"--- Created Survey ---")
        print(f"ID: {new_id}, Title: {title}")
        print("----------------------")
        return new_survey

    @strawberry.field(
        description="""Update specific fields of an existing survey.

Parameters:
- surveyId: The ID of the survey to update.
- input: An object containing the fields to update. Only fields provided in the input will be changed.

Returns the updated Survey object, or null if the surveyId is not found."""
    )
    def update_survey(  # Renamed from update_survey_title
        self,
        survey_id: str,
        input: UpdateSurveyInput
    ) -> Optional[Survey]:
        """
        Updates specific fields of a survey identified by its ID based on the provided input.

        Parameters:
        - survey_id: The unique identifier of the survey to update.
        - input: An UpdateSurveyInput object containing the fields to modify.

        Returns the updated Survey object if found, otherwise None.
        """
        survey = SURVEY_DB.get(survey_id)
        if survey:
            updated = False
            # Check if title was provided in the input
            if input.title is not strawberry.UNSET and input.title is not None: # Also ensure it's not explicitly null if that's disallowed
                survey.title = input.title
                print(f"--- Updating Survey Title ---")
                print(f"ID: {survey_id}, New Title: {input.title}")
                updated = True
            
            # Add checks for other fields from input here later, e.g.:
            # if input.description is not strawberry.UNSET:
            #     survey.description = input.description
            #     updated = True
                
            if updated:
                 print("----------------------------")
            else:
                 print(f"--- Update Survey Called (No changes) ---")
                 print(f"ID: {survey_id}, Input received but no fields matched for update.")
                 print("-----------------------------------------")
            return survey
        else:
            print(f"--- Update Survey Failed ---")
            print(f"Survey ID not found: {survey_id}")
            print("----------------------------")
            return None # Survey with the given ID not found

    @strawberry.field(
        description="""Add a new, empty block to a survey at a specific position.

Parameters:
- surveyId: The ID of the survey to add the block to.
- position: The 0-indexed position where the new block should be inserted.
            If position is out of bounds, it will be clamped to the nearest valid position (start or end).

Returns the newly created Block object, or null if the surveyId is not found."""
    )
    def add_block_to_survey(
        self,
        survey_id: str,
        position: int
    ) -> Optional[Block]:
        """
        Adds a new block to a survey at the specified position, adjusting existing block positions.

        Parameters:
        - survey_id: The unique identifier of the survey.
        - position: The desired 0-indexed position for the new block.

        Returns the newly created Block object if successful, otherwise None.
        """
        survey = SURVEY_DB.get(survey_id)
        if not survey:
            print(f"--- Add Block Failed ---")
            print(f"Survey ID not found: {survey_id}")
            print("------------------------")
            return None

        # Generate unique block ID (simple approach)
        block_num = 1
        new_block_id = f"{survey_id}_block_{block_num}"
        # Ensure ID uniqueness within this survey's blocks
        existing_block_ids = {b.id for b in survey.blocks}
        while new_block_id in existing_block_ids:
            block_num += 1
            new_block_id = f"{survey_id}_block_{block_num}"

        new_block = Block(
            id=new_block_id,
            position=-1, # Placeholder, will be set below
            questions=[]
        )

        # Clamp position to valid range [0, len(survey.blocks)]
        num_blocks = len(survey.blocks)
        actual_position = max(0, min(position, num_blocks))

        # Insert the new block at the calculated position index
        survey.blocks.insert(actual_position, new_block)

        # Update position attribute for all blocks in the survey to match their list index
        for idx, block in enumerate(survey.blocks):
            block.position = idx

        print(f"--- Added Block to Survey ---")
        print(f"Survey ID: {survey_id}, New Block ID: {new_block_id}, Position: {actual_position}")
        print("-----------------------------")
        return new_block # Return the newly added block

    @strawberry.field(
        description="""Update specific fields of an existing block.

Parameters:
- blockId: The ID of the block to update.
- input: An object containing the fields to update.

Returns the updated Block object, or null if the blockId is not found."""
        # Note: Currently no fields are updatable via this input. Add fields to UpdateBlockInput first.
    )
    def update_block(
        self,
        block_id: str,
        input: UpdateBlockInput
    ) -> Optional[Block]:
        """
        Updates specific fields of a block identified by its ID.
        Currently only searches for the block; add field updates logic if UpdateBlockInput gets fields.
        """
        # Find the block (need to iterate through surveys/blocks)
        target_block: Optional[Block] = None
        for survey in SURVEY_DB.values():
            for block in survey.blocks:
                if block.id == block_id:
                    target_block = block
                    parent_survey_id = survey.id
                    break
            if target_block:
                break
        
        if target_block:
            updated = False
            # --- Logic to update fields based on input ---
            # Update title if provided
            if input.title is not strawberry.UNSET:
                target_block.title = input.title # Allow setting title to null/None if provided explicitly
                updated = True
            # --- End of update logic ---

            if updated:
                print(f"--- Updated Block ---")
                # Be careful printing the whole input if it might contain sensitive data later
                print(f"Survey ID: {parent_survey_id}, Block ID: {block_id}, Updated Fields: {{'title': {target_block.title}}})")
                print("--------------------")
            else:
                print(f"--- Update Block Called (No changes) ---")
                print(f"Block ID: {block_id}, Input received but no fields matched for update.")
                print("--------------------------------------")
            return target_block
        else:
            print(f"--- Update Block Failed ---")
            print(f"Block ID not found: {block_id}")
            print("---------------------------")
            return None

    @strawberry.field(
        description="""Update specific fields of an existing question.

Parameters:
- questionId: The ID of the question to update.
- input: An object containing the fields to update (e.g., text).

Returns the updated Question object, or null if the questionId is not found."""
    )
    def update_question(
        self,
        question_id: str,
        input: UpdateQuestionInput
    ) -> Optional[Question]:
        """
        Updates specific fields (like text) of a question identified by its ID.
        """
        target_question: Optional[Question] = None
        # Find the question (iterate through surveys/blocks/questions)
        for survey in SURVEY_DB.values():
            for block in survey.blocks:
                for question in block.questions:
                    if question.id == question_id:
                        target_question = question
                        break
                if target_question: break
            if target_question: break

        if target_question:
            updated = False
            # Check if text was provided
            if input.text is not strawberry.UNSET and input.text is not None:
                 target_question.text = input.text
                 updated = True

            # Add checks for other fields later

            if updated:
                print(f"--- Updated Question ---")
                print(f"Question ID: {question_id}, New Text: {target_question.text}") # Example print
                print("-----------------------")
            else:
                print(f"--- Update Question Called (No changes) ---")
                print(f"Question ID: {question_id}, Input received but no fields matched for update.")
                print("-----------------------------------------")
            return target_question
        else:
            print(f"--- Update Question Failed ---")
            print(f"Question ID not found: {question_id}")
            print("------------------------------")
            return None

    @strawberry.field(
        description="""Move a block one step UP or DOWN within its parent survey.
        This will reorder the blocks in the survey and update their position attributes accordingly.

        Parameters:
        - blockId: The ID of the block to move.
        - direction: The direction to move the block (UP or DOWN).

        Returns the parent Survey object with the updated block order, or null if the block is not found or cannot be moved (e.g., already at the top/bottom)."""
    )
    def move_block(
        self,
        block_id: str,
        direction: MoveDirection # Use the enum
    ) -> Optional[Survey]:
        target_block: Optional[Block] = None
        parent_survey: Optional[Survey] = None

        # 1. Find the block and its parent survey
        for survey in SURVEY_DB.values():
            for idx, block in enumerate(survey.blocks):
                if block.id == block_id:
                    target_block = block
                    parent_survey = survey
                    current_index = idx
                    break
            if parent_survey:
                break
        
        if not parent_survey or not target_block:
            print(f"--- Move Block Failed: Block not found (ID: {block_id}) ---")
            return None # Block or survey not found

        # 2. Calculate the new index
        num_blocks = len(parent_survey.blocks)
        new_index = current_index

        if direction == MoveDirection.UP:
            if current_index == 0:
                print(f"--- Move Block Skipped: Block already at top (ID: {block_id}) ---")
                return parent_survey # Already at the top, no change
            new_index = current_index - 1
        elif direction == MoveDirection.DOWN:
            if current_index == num_blocks - 1:
                print(f"--- Move Block Skipped: Block already at bottom (ID: {block_id}) ---")
                return parent_survey # Already at the bottom, no change
            new_index = current_index + 1

        # 3. Reorder the list
        # Remove the block from its current position
        moved_block = parent_survey.blocks.pop(current_index)
        # Insert it at the new position
        parent_survey.blocks.insert(new_index, moved_block)

        # 4. Update position attributes for all blocks in the survey
        for idx, block in enumerate(parent_survey.blocks):
            block.position = idx

        print(f"--- Moved Block --- ")
        print(f"Survey ID: {parent_survey.id}, Block ID: {block_id}, Direction: {direction.name}, New Position: {new_index}")
        print("-----------------")
        return parent_survey

    @strawberry.field(
        description="""Move a question one step UP or DOWN within its parent block.
        This will reorder the questions in the block and update their position attributes accordingly.

        Parameters:
        - questionId: The ID of the question to move.
        - direction: The direction to move the question (UP or DOWN).

        Returns the parent Block object with the updated question order, or null if the question is not found or cannot be moved."""
    )
    def move_question(
        self,
        question_id: str,
        direction: MoveDirection # Use the enum
    ) -> Optional[Block]:
        target_question: Optional[Question] = None
        parent_block: Optional[Block] = None
        parent_survey_id: Optional[str] = None # For logging
        current_index: Optional[int] = None

        # 1. Find the question and its parent block/survey
        for survey in SURVEY_DB.values():
            for block in survey.blocks:
                for idx, question in enumerate(block.questions):
                    if question.id == question_id:
                        target_question = question
                        parent_block = block
                        parent_survey_id = survey.id
                        current_index = idx
                        break
                if parent_block: break
            if parent_block: break
        
        if not parent_block or not target_question or current_index is None:
            print(f"--- Move Question Failed: Question not found (ID: {question_id}) ---")
            return None # Question or block not found

        # 2. Calculate the new index
        num_questions = len(parent_block.questions)
        new_index = current_index

        if direction == MoveDirection.UP:
            if current_index == 0:
                print(f"--- Move Question Skipped: Question already at top (ID: {question_id}) ---")
                return parent_block # Already at the top
            new_index = current_index - 1
        elif direction == MoveDirection.DOWN:
            if current_index == num_questions - 1:
                print(f"--- Move Question Skipped: Question already at bottom (ID: {question_id}) ---")
                return parent_block # Already at the bottom
            new_index = current_index + 1

        # 3. Reorder the list
        moved_question = parent_block.questions.pop(current_index)
        parent_block.questions.insert(new_index, moved_question)

        # 4. Update position attributes for all questions in the block
        for idx, question in enumerate(parent_block.questions):
            question.position = idx

        print(f"--- Moved Question --- ")
        print(f"Survey ID: {parent_survey_id}, Block ID: {parent_block.id}, Question ID: {question_id}, Direction: {direction.name}, New Position: {new_index}")
        print("--------------------")
        return parent_block

# Create the GraphQL schema instance
schema = strawberry.Schema(query=Query, mutation=Mutation) 