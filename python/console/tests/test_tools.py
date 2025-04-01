import unittest
import tempfile
import shutil
from pathlib import Path

from ..models import Survey, Question, QuestionType
from ..storage.json_storage import JsonStorage
from ..tools import SurveyTools

class TestSurveyTools(unittest.TestCase):
    def setUp(self):
        """Set up test environment before each test."""
        # Create a temporary directory for test files
        self.test_dir = tempfile.mkdtemp()
        self.storage = JsonStorage(storage_dir=self.test_dir)
        self.tools = SurveyTools(self.storage)

    def tearDown(self):
        """Clean up after each test."""
        # Remove the temporary directory and all its contents
        shutil.rmtree(self.test_dir)

    def test_create_and_load_survey(self):
        """Test creating and loading a survey."""
        # Create a survey
        survey = self.tools.create_survey(
            name="Test Survey",
            description="A test survey"
        )
        
        # Verify survey was created
        self.assertIsNotNone(survey.id)
        self.assertEqual(survey.name, "Test Survey")
        self.assertEqual(survey.description, "A test survey")
        
        # Load the survey
        loaded_survey = self.tools.load_survey(survey.id)
        self.assertIsNotNone(loaded_survey)
        self.assertEqual(loaded_survey.id, survey.id)
        self.assertEqual(loaded_survey.name, survey.name)
        self.assertEqual(loaded_survey.description, survey.description)

    def test_add_and_edit_question(self):
        """Test adding and editing a question."""
        # Create a survey
        survey = self.tools.create_survey(
            name="Test Survey",
            description="A test survey"
        )
        
        # Add a question
        question = self.tools.add_question(
            survey_id=survey.id,
            text="What is your favorite color?",
            question_type=QuestionType.RADIO,
            options=["Red", "Blue", "Green"]
        )
        
        # Verify question was added
        self.assertIsNotNone(question)
        self.assertEqual(question.text, "What is your favorite color?")
        self.assertEqual(question.type, QuestionType.RADIO)
        self.assertEqual(question.options, ["Red", "Blue", "Green"])
        
        # Edit the question
        edited_question = self.tools.edit_question(
            survey_id=survey.id,
            question_id=question.id,
            text="What is your favorite color? (Updated)",
            options=["Red", "Blue", "Green", "Yellow"]
        )
        
        # Verify question was edited
        self.assertIsNotNone(edited_question)
        self.assertEqual(edited_question.text, "What is your favorite color? (Updated)")
        self.assertEqual(edited_question.options, ["Red", "Blue", "Green", "Yellow"])

    def test_delete_question(self):
        """Test deleting a question."""
        # Create a survey
        survey = self.tools.create_survey(
            name="Test Survey",
            description="A test survey"
        )
        
        # Add a question
        question = self.tools.add_question(
            survey_id=survey.id,
            text="Test Question",
            question_type=QuestionType.YES_NO
        )
        
        # Delete the question
        success = self.tools.delete_question(survey.id, question.id)
        self.assertTrue(success)
        
        # Verify question was deleted
        loaded_survey = self.tools.load_survey(survey.id)
        self.assertEqual(len(loaded_survey.questions), 0)

    def test_list_surveys(self):
        """Test listing surveys."""
        # Create multiple surveys
        survey1 = self.tools.create_survey("Survey 1", "First survey")
        survey2 = self.tools.create_survey("Survey 2", "Second survey")
        
        # List surveys
        surveys = self.tools.list_surveys()
        self.assertEqual(len(surveys), 2)
        survey_ids = {s.id for s in surveys}
        self.assertEqual(survey_ids, {survey1.id, survey2.id})

    def test_delete_survey(self):
        """Test deleting a survey."""
        # Create a survey
        survey = self.tools.create_survey(
            name="Test Survey",
            description="A test survey"
        )
        
        # Delete the survey
        success = self.tools.delete_survey(survey.id)
        self.assertTrue(success)
        
        # Verify survey was deleted
        loaded_survey = self.tools.load_survey(survey.id)
        self.assertIsNone(loaded_survey)

if __name__ == '__main__':
    unittest.main() 