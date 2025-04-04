import unittest
import asyncio
import tempfile
import shutil
import sys
import os
import logging
from dotenv import load_dotenv

from agents import Runner

import agent_tools
from survey_agents import  survey_parser

# Add the parent directory to sys.path to fix imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from models import SurveyContext, QuestionType
from tools import SurveyTools
from json_storage import JsonStorage

# Configure logging for OpenAI Agents SDK
logger = logging.getLogger("openai.agents")  # Use "openai.agents.tracing" for tracing logs
logger.setLevel(logging.DEBUG)
handler = logging.StreamHandler()  # Or use `logging.FileHandler("logfile.log")`
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class TestSurveyParser(unittest.TestCase):
    def setUp(self):
        # Load environment variables from .env file
        load_dotenv()
        
        # Verify OpenAI API key is set
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("OPENAI_API_KEY not found in environment variables. Please set it in the .env file.")
            
        # Create a temporary directory for storing survey data during tests
        self.temp_dir = tempfile.mkdtemp()
        self.storage = JsonStorage(self.temp_dir)
        self.tools = SurveyTools(self.storage)
        agent_tools.set_tools(self.tools)
        self.context = SurveyContext()
        
    def tearDown(self):
        # Clean up the temporary directory
        shutil.rmtree(self.temp_dir)
        
    def test_yes_no_question_parsing(self):
        # Create test survey text with only a Yes/No question
        survey_text = """We'd love to hear your thoughts! Please take a moment to answer this question:

Did you find our website easy to navigate?
(Yes / No)
"""

        # Run the parser on the survey text asynchronously
        result = asyncio.run(self._run_parser(survey_text))
        
        # Check surveys in storage
        surveys = self.storage.list_surveys()
        self.assertEqual(len(surveys), 1, "One survey should have been created")
        
        # Get the first survey
        survey = surveys[0]
        
        # Validate survey questions
        self.assertEqual(len(survey.questions), 1, "Survey should have 1 question")
        
        # Validate the Yes/No question
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "Did you find our website easy to navigate?")
        self.assertEqual(q1.type, QuestionType.RADIO)
        self.assertEqual(q1.options, ["Yes", "No"])
        self.assertTrue(q1.question_options.required)
    
    def test_multiple_choice_question_parsing(self):
        # Create test survey text with only a multiple choice question
        survey_text = """We'd love to hear your thoughts! Please take a moment to answer this question:

Which features do you currently use on our platform, select all that apply?
Dashboard
Notifications
File Sharing
Analytics
"""

        # Run the parser on the survey text asynchronously
        result = asyncio.run(self._run_parser(survey_text))
        
        # Check surveys in storage
        surveys = self.storage.list_surveys()
        self.assertEqual(len(surveys), 1, "One survey should have been created")
        
        # Get the first survey
        survey = surveys[0]
        
        # Validate survey questions
        self.assertEqual(len(survey.questions), 1, "Survey should have 1 question")
        
        # Validate the multiple choice question
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "Which features do you currently use on our platform?")
        self.assertEqual(q1.type, QuestionType.MULTIPLE_CHOICE)
        self.assertEqual(set(q1.options), {"Dashboard", "Notifications", "File Sharing", "Analytics"})
        self.assertTrue(q1.question_options.required)
    
    def test_numeric_question_parsing(self):
        # Create test survey text with only a numeric question
        survey_text = """We'd love to hear your thoughts! Please take a moment to answer this question:

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
        self.assertEqual(len(survey.questions), 1, "Survey should have 1 question")
        
        # Validate the numeric question
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "Approximately how many hours per week do you use our platform?")
        self.assertEqual(q1.type, QuestionType.NUMERIC)
        self.assertTrue(q1.question_options.required)
        self.assertIsNotNone(q1.question_options.min_value)
        self.assertEqual(q1.question_options.min_value, 0)
        
    async def _run_parser(self, survey_text):
        # Run the actual survey parser with the sample text
        result = await Runner.run(
            survey_parser, 
            survey_text
        )
        
        return result

if __name__ == "__main__":
    unittest.main()
