import unittest
from test_utils import BaseAgentTest
from models import QuestionType

class TestSurveyTools(BaseAgentTest, unittest.TestCase):
    def test_create_and_load_survey(self):
        """Test creating and loading a survey."""
        # Create a survey
        survey = self.tools.create_survey(
            name="Test Survey",
            description="A test survey"
        )
        
        # Verify survey was created
        self.assertIsNotNone(survey)
        self.assertEqual(survey.name, "Test Survey")
        self.assertEqual(survey.description, "A test survey")
        
        # Load the survey
        loaded_survey = self.tools.load_survey(survey.id)
        
        # Verify loaded survey matches created survey
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
            options=["Red", "Blue", "Green"],
            question_options={"required": True}
        )
        
        # Verify question was added
        self.assertIsNotNone(question)
        self.assertEqual(question.text, "What is your favorite color?")
        self.assertEqual(question.type, QuestionType.RADIO)
        self.assertEqual(question.options, ["Red", "Blue", "Green"])
        self.assertTrue(question.question_options.required)
        
        # Edit the question
        edited_question = self.tools.edit_question(
            survey_id=survey.id,
            question_id=question.id,
            text="What is your favorite color? (Please select one)",
            options=["Red", "Blue", "Green", "Yellow"]
        )
        
        # Verify question was edited
        self.assertIsNotNone(edited_question)
        self.assertEqual(edited_question.text, "What is your favorite color? (Please select one)")
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
            text="What is your favorite color?",
            question_type=QuestionType.RADIO,
            options=["Red", "Blue", "Green"],
            question_options={"required": True}
        )
        
        # Delete the question
        result = self.tools.delete_question(
            survey_id=survey.id,
            question_id=question.id
        )
        
        # Verify question was deleted
        self.assertTrue(result)
        
        # Load the survey and verify question is gone
        loaded_survey = self.tools.load_survey(survey.id)
        self.assertEqual(len(loaded_survey.questions), 0)
        
    def test_list_surveys(self):
        """Test listing surveys."""
        # Create a survey
        survey = self.tools.create_survey(
            name="Test Survey",
            description="A test survey"
        )
        
        # List surveys
        surveys = self.tools.list_surveys()
        
        # Verify survey is in the list
        self.assertEqual(len(surveys), 1)
        self.assertEqual(surveys[0].id, survey.id)
        
    def test_delete_survey(self):
        """Test deleting a survey."""
        # Create a survey
        survey = self.tools.create_survey(
            name="Test Survey",
            description="A test survey"
        )
        
        # Delete the survey
        result = self.tools.delete_survey(survey.id)
        
        # Verify survey was deleted
        self.assertTrue(result)
        
        # List surveys and verify survey is gone
        surveys = self.tools.list_surveys()
        self.assertEqual(len(surveys), 0)

if __name__ == '__main__':
    unittest.main() 