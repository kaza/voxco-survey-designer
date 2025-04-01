from typing import List, Optional, Dict, Any
from models import Survey, Question, QuestionType, QuestionOptions
from json_storage import JsonStorage

class SurveyTools:
    def __init__(self, storage: JsonStorage):
        self.storage = storage

    def list_surveys(self) -> List[Survey]:
        """List all available surveys."""
        return self.storage.list_surveys()

    def create_survey(self, name: str, description: str) -> Survey:
        """Create a new survey."""
        survey = Survey(name=name, description=description)
        self.storage.save_survey(survey)
        return survey

    def add_question(self, survey_id: str, text: str, question_type: QuestionType, 
                    options: List[str] = None, question_options: Dict[str, Any] = None) -> Optional[Question]:
        """Add a question to a survey."""
        survey = self.storage.load_survey(survey_id)
        if not survey:
            return None

        # Create QuestionOptions instance from dict if provided
        options_instance = QuestionOptions()
        if question_options:
            for key, value in question_options.items():
                if hasattr(options_instance, key):
                    setattr(options_instance, key, value)

        question = Question(
            text=text,
            type=question_type,
            position=len(survey.questions),
            options=options or [],
            question_options=options_instance
        )
        survey.add_question(question)
        self.storage.save_survey(survey)
        return question

    def edit_question(self, survey_id: str, question_id: str, text: str = None, 
                     question_type: QuestionType = None, options: List[str] = None,
                     question_options: Dict[str, Any] = None) -> Optional[Question]:
        """Edit an existing question in a survey."""
        survey = self.storage.load_survey(survey_id)
        if not survey:
            return None

        question = next((q for q in survey.questions if q.id == question_id), None)
        if not question:
            return None

        if text:
            question.text = text
        if question_type:
            question.type = question_type
        if options is not None:
            question.options = options
        if question_options:
            for key, value in question_options.items():
                if hasattr(question.question_options, key):
                    setattr(question.question_options, key, value)

        self.storage.save_survey(survey)
        return question

    def delete_question(self, survey_id: str, question_id: str) -> bool:
        """Delete a question from a survey."""
        survey = self.storage.load_survey(survey_id)
        if not survey:
            return False

        initial_length = len(survey.questions)
        survey.questions = [q for q in survey.questions if q.id != question_id]
        
        if len(survey.questions) < initial_length:
            # Update positions of remaining questions
            for i, question in enumerate(survey.questions):
                question.position = i
            self.storage.save_survey(survey)
            return True
        return False

    def load_survey(self, survey_id: str) -> Optional[Survey]:
        """Load a survey from storage."""
        return self.storage.load_survey(survey_id)

    def save_survey(self, survey: Survey) -> None:
        """Save a survey to storage."""
        self.storage.save_survey(survey)

    def delete_survey(self, survey_id: str) -> bool:
        """Delete a survey."""
        return self.storage.delete_survey(survey_id) 