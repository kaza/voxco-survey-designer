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
        self.assertTrue(q1.question_options.required)
        self.assertIsNotNone(q1.question_options.min_value)
        self.assertEqual(q1.question_options.min_value, 0)
        
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