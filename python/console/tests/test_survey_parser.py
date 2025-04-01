import unittest
import asyncio
import tempfile
import shutil
import sys
import os

from agents import Runner

import agent_tools
from survey_agents import  survey_parser

# Add the parent directory to sys.path to fix imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from models import SurveyContext, QuestionType
from tools import SurveyTools
from json_storage import JsonStorage

class TestSurveyParser(unittest.TestCase):
    def setUp(self):
        # Create a temporary directory for storing survey data during tests
        self.temp_dir = tempfile.mkdtemp()
        self.storage = JsonStorage(self.temp_dir)
        self.tools = SurveyTools(self.storage)
        agent_tools.set_tools(self.tools)
        self.context = SurveyContext()
        
    def tearDown(self):
        # Clean up the temporary directory
        shutil.rmtree(self.temp_dir)
        
    def test_survey_parser(self):
        # Create test survey text
        survey_text = """We'd love to hear your thoughts! Please take a moment to answer these questions:

Did you find our website easy to navigate?
(Yes / No)

Which features do you currently use on our platform, select all that apply?
Dashboard
Notifications
File Sharing
Analytics

Approximately how many hours per week do you use our platform?
(Please enter a number)
"""
        
        # Run the parser on the survey text asynchronously
        result = asyncio.run(self._run_parser(survey_text))
        
        # Check surveys in storage
        surveys = self.storage.list_surveys()
        self.assertEqual(len(surveys), 1, "One survey should have been created")
        
        # Get the first survey
        survey = surveys[0]
        
        # Validate survey questions
        self.assertEqual(len(survey.questions), 3, "Survey should have 3 questions")
        
        # Validate first question (Yes/No question)
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "Did you find our website easy to navigate?")
        self.assertEqual(q1.type, QuestionType.RADIO)
        self.assertEqual(q1.options, ["Yes", "No"])
        self.assertTrue(q1.question_options.required)
        
        # Validate second question (Multiple choice)
        q2 = survey.questions[1]
        self.assertEqual(q2.text, "Which features do you currently use on our platform?")
        self.assertEqual(q2.type, QuestionType.MULTIPLE_CHOICE)
        self.assertEqual(set(q2.options), {"Dashboard", "Notifications", "File Sharing", "Analytics"})
        self.assertTrue(q2.question_options.required)
        
        # Validate third question (Numeric)
        q3 = survey.questions[2]
        self.assertEqual(q3.text, "Approximately how many hours per week do you use our platform?")
        self.assertEqual(q3.type, QuestionType.NUMERIC)
        self.assertTrue(q3.question_options.required)
        self.assertIsNotNone(q3.question_options.min_value)
        self.assertEqual(q3.question_options.min_value, 0)
        
    async def _run_parser(self, survey_text):
        # Run the actual survey parser with the sample text
        result = await Runner.run(
            survey_parser, 
            survey_text
        )
        
        return result

if __name__ == "__main__":
    unittest.main()
