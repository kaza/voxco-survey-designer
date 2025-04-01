import json
from typing import List, Optional
from pathlib import Path

from ..models import Survey, Question, QuestionType

# Note: We need manual serialization/deserialization because we're working with Python dataclasses and enums.
# Simple JSON serialization (json.dumps()) doesn't know how to handle:
# - Python dataclasses (Question and Survey)
# - Enums (QuestionType)
# - Complex nested objects
# So we need to manually convert between Python objects and JSON-serializable dictionaries.

class JsonStorage:
    def __init__(self, storage_dir: str = "surveys"):
        """Initialize storage with a directory for survey files."""
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)

    def _get_survey_path(self, survey_id: str) -> Path:
        """Get the path for a survey file."""
        return self.storage_dir / f"{survey_id}.json"

    def save_survey(self, survey: Survey) -> None:
        """Save a survey to JSON file."""
        survey_path = self._get_survey_path(survey.id)
        survey_data = {
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
                    "survey_id": q.survey_id
                }
                for q in survey.questions
            ]
        }
        
        with open(survey_path, 'w', encoding='utf-8') as f:
            json.dump(survey_data, f, indent=2, ensure_ascii=False)

    def load_survey(self, survey_id: str) -> Optional[Survey]:
        """Load a survey from JSON file."""
        survey_path = self._get_survey_path(survey_id)
        if not survey_path.exists():
            return None

        try:
            with open(survey_path, 'r', encoding='utf-8') as f:
                survey_data = json.load(f)
            
            questions = [
                Question(
                    id=q["id"],
                    text=q["text"],
                    type=QuestionType(q["type"]),
                    position=q["position"],
                    options=q["options"],
                    survey_id=q["survey_id"]
                )
                for q in survey_data["questions"]
            ]
            
            return Survey(
                id=survey_data["id"],
                name=survey_data["name"],
                description=survey_data["description"],
                questions=questions
            )
        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error loading survey {survey_id}: {e}")
            return None

    def list_surveys(self) -> List[Survey]:
        """List all available surveys."""
        surveys = []
        for file in self.storage_dir.glob("*.json"):
            survey_id = file.stem
            survey = self.load_survey(survey_id)
            if survey:
                surveys.append(survey)
        return surveys

    def delete_survey(self, survey_id: str) -> bool:
        """Delete a survey."""
        survey_path = self._get_survey_path(survey_id)
        if survey_path.exists():
            try:
                survey_path.unlink()
                return True
            except Exception as e:
                print(f"Error deleting survey {survey_id}: {e}")
                return False
        return False 