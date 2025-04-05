import unittest
import asyncio
from agents import Runner
from survey_agents import survey_parser
from test_utils import setup_logging, BaseAgentTest
from models import QuestionType, SurveyContext

# Setup logging
setup_logging()

class TestSurveyParser(BaseAgentTest, unittest.TestCase):
    def test_numeric_question_parsing(self):
        # Create test survey text with only a numeric question
        survey_text = """
        Hey, can you generate a survey with following content:
        We'd love to hear your thoughts about Zebra! Please take a moment to answer this question:

Approximately how many hours per week do you use our platform?
(Please enter a number)
"""

        # Run the parser on the survey text asynchronously and get the context
        result, context = asyncio.run(self._run_parser(survey_text))
        
        # Verify that SurveyContext exists
        self.assertIsNotNone(context, "SurveyContext should exist")
        
        # Verify that the context has one survey
        self.assertEqual(len(context.surveys), 1, "Context should have one survey")
        
        # Verify that the current_survey is set
        self.assertIsNotNone(context.current_survey, "Context should have current_survey set")
        
        # Get the survey from context
        survey = context.current_survey
        
        # Validate survey questions
        self.assertEqual(len(survey.questions), 1, "Survey should have 1 question")
        
        # Validate the numeric question
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "Approximately how many hours per week do you use our platform?")
        self.assertEqual(q1.type, QuestionType.NUMERIC)
        
    def test_radio_question_parsing(self):
        # Create test survey text with a radio question
        survey_text = """
        Hey, can you generate a survey with following content:
        What is your preferred method of contact?
        
        - Email
        - Phone
        - Mail
        - SMS
        """
        
        # Run the parser on the survey text asynchronously and get the context
        result, context = asyncio.run(self._run_parser(survey_text))
        
        # Get the survey from context
        survey = context.current_survey
        
        # Validate survey questions
        self.assertEqual(len(survey.questions), 1, "Survey should have 1 question")
        
        # Validate the radio question
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "What is your preferred method of contact?")
        self.assertEqual(q1.type, QuestionType.RADIO)
        self.assertEqual(len(q1.options), 4, "Radio question should have 4 options")
        self.assertEqual(q1.options[0], "Email")
        self.assertEqual(q1.options[1], "Phone")
        self.assertEqual(q1.options[2], "Mail")
        self.assertEqual(q1.options[3], "SMS")
        
    def test_multiple_choice_question_parsing(self):
        # Create test survey text with a multiple choice question
        survey_text = """
        Hey, can you generate a survey with following content:
        Which of the following features do you use? (Select all that apply)
        
        - Feature A
        - Feature B
        - Feature C
        - Feature D
        """
        
        # Run the parser on the survey text asynchronously and get the context
        result, context = asyncio.run(self._run_parser(survey_text))
        
        # Get the survey from context
        survey = context.current_survey
        
        # Validate survey questions
        self.assertEqual(len(survey.questions), 1, "Survey should have 1 question")
        
        # Validate the multiple choice question
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "Which of the following features do you use?")
        self.assertEqual(q1.type, QuestionType.MULTIPLE_CHOICE)
        self.assertEqual(len(q1.options), 4, "Multiple choice question should have 4 options")
        self.assertEqual(q1.options[0], "Feature A")
        self.assertEqual(q1.options[1], "Feature B")
        self.assertEqual(q1.options[2], "Feature C")
        self.assertEqual(q1.options[3], "Feature D")
        
    def test_open_ended_question_parsing(self):
        # Create test survey text with an open-ended question
        survey_text = """
        Hey, can you generate a survey with following content:
        Please describe your experience with our product in detail.
        """
        
        # Run the parser on the survey text asynchronously and get the context
        result, context = asyncio.run(self._run_parser(survey_text))
        
        # Get the survey from context
        survey = context.current_survey
        
        # Validate survey questions
        self.assertEqual(len(survey.questions), 1, "Survey should have 1 question")
        
        # Validate the open-ended question
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "Please describe your experience with our product in detail.")
        self.assertEqual(q1.type, QuestionType.OPEN_ENDED)
        
    def test_drop_down_question_parsing(self):
        # Create test survey text with a drop-down question
        survey_text = """
        Hey, can you generate a survey with following content:
        Select your country of residence:
        
        - United States
        - Canada
        - Mexico
        - United Kingdom
        - France
        - Germany
        """
        
        # Run the parser on the survey text asynchronously and get the context
        result, context = asyncio.run(self._run_parser(survey_text))
        
        # Get the survey from context
        survey = context.current_survey
        
        # Validate survey questions
        self.assertEqual(len(survey.questions), 1, "Survey should have 1 question")
        
        # Validate the drop-down question
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "Select your country of residence:")
        self.assertEqual(q1.type, QuestionType.DROP_DOWN)
        self.assertEqual(len(q1.options), 6, "Drop-down question should have 6 options")
        self.assertEqual(q1.options[0], "United States")
        self.assertEqual(q1.options[1], "Canada")
        self.assertEqual(q1.options[2], "Mexico")
        self.assertEqual(q1.options[3], "United Kingdom")
        self.assertEqual(q1.options[4], "France")
        self.assertEqual(q1.options[5], "Germany")
        
    async def _run_parser(self, survey_text):
        # Create a fresh SurveyContext instance
        survey_context = SurveyContext()
        
        # Run the actual survey parser with the sample text
        result = await Runner.run(
            starting_agent=survey_parser, 
            input=survey_text,
            context=survey_context
        )
        
        # Return both the result and the context
        return result, survey_context

if __name__ == "__main__":
    unittest.main() 