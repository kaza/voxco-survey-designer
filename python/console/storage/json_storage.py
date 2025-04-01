import json
from typing import List, Optional
from pathlib import Path

from ..models import Survey, Question, QuestionType, QuestionOptions

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
                    "survey_id": q.survey_id,
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
            
            questions = []
            for q in survey_data["questions"]:
                # Create QuestionOptions instance
                options_data = q.get("question_options", {})
                question_options = QuestionOptions(
                    required=options_data.get("required", True),
                    randomize_choices=options_data.get("randomize_choices", False),
                    min_selections=options_data.get("min_selections"),
                    max_selections=options_data.get("max_selections"),
                    none_of_above=options_data.get("none_of_above", False),
                    validation_rules=options_data.get("validation_rules"),
                    placeholder=options_data.get("placeholder"),
                    alphabetize_choices=options_data.get("alphabetize_choices", False),
                    min_value=options_data.get("min_value"),
                    max_value=options_data.get("max_value"),
                    allow_decimal=options_data.get("allow_decimal", False),
                    unit=options_data.get("unit"),
                    scale_min=options_data.get("scale_min", 1),
                    scale_max=options_data.get("scale_max", 5),
                    visual_style=options_data.get("visual_style", "stars"),
                    scale_labels=options_data.get("scale_labels")
                )
                
                # Create Question instance
                question = Question(
                    id=q["id"],
                    text=q["text"],
                    type=QuestionType(q["type"]),
                    position=q["position"],
                    options=q["options"],
                    survey_id=q["survey_id"],
                    question_options=question_options
                )
                questions.append(question)
            
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