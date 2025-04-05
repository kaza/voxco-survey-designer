import unittest
import asyncio
from agents import Runner
from survey_agents import survey_parser
from test_utils import setup_logging, BaseAgentTest
from models import QuestionType, SurveyContext

# Setup logging
setup_logging()

class TestMultipleQuestionsParser(BaseAgentTest, unittest.TestCase):
    def test_two_different_question_types(self):
        # Create test survey text with two different question types
        survey_text = """
        Hey, can you generate a survey with following content:
        
        Question 1: Approximately how many hours per week do you use our platform?
        (Please enter a number)
        
        Question 2: What is your preferred method of contact?
        
        - Email
        - Phone
        - Mail
        - SMS
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
        self.assertEqual(len(survey.questions), 2, "Survey should have 2 questions")
        
        # Validate the first question (numeric)
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "Approximately how many hours per week do you use our platform?")
        self.assertEqual(q1.type, QuestionType.NUMERIC)
        
        # Validate the second question (radio)
        q2 = survey.questions[1]
        self.assertEqual(q2.text, "What is your preferred method of contact?")
        self.assertEqual(q2.type, QuestionType.RADIO)
        self.assertEqual(len(q2.options), 4, "Radio question should have 4 options")
        
    def test_5_question_types(self):
        # Create test survey text with all question types
        survey_text = """
        Hey, can you generate a survey with following content:
        
        Question 1: What is your age?
        (Please enter a number)
        
        Question 2: What is your preferred method of contact?
        
        - Email
        - Phone
        - Mail
        - SMS
        
        Question 3: Which of the following features do you use? (Select all that apply)
        
        - Feature A
        - Feature B
        - Feature C
        - Feature D
        
        Question 4: Please describe your experience with our product in detail.
        
        Question 5: Select your country of residence:
        
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
        self.assertEqual(len(survey.questions), 5, "Survey should have 5 questions")
        
        # Validate the first question (numeric)
        q1 = survey.questions[0]
        self.assertEqual(q1.text, "What is your age?")
        self.assertEqual(q1.type, QuestionType.NUMERIC)
        
        # Validate the second question (radio)
        q2 = survey.questions[1]
        self.assertEqual(q2.text, "What is your preferred method of contact?")
        self.assertEqual(q2.type, QuestionType.RADIO)
        self.assertEqual(len(q2.options), 4, "Radio question should have 4 options")
        self.assertEqual(q2.options[0], "Email")
        self.assertEqual(q2.options[1], "Phone")
        self.assertEqual(q2.options[2], "Mail")
        self.assertEqual(q2.options[3], "SMS")
        
        # Validate the third question (multiple choice)
        q3 = survey.questions[2]
        self.assertEqual(q3.text, "Which of the following features do you use?")
        self.assertEqual(q3.type, QuestionType.MULTIPLE_CHOICE)
        self.assertEqual(len(q3.options), 4, "Multiple choice question should have 4 options")
        self.assertEqual(q3.options[0], "Feature A")
        self.assertEqual(q3.options[1], "Feature B")
        self.assertEqual(q3.options[2], "Feature C")
        self.assertEqual(q3.options[3], "Feature D")
        
        # Validate the fourth question (open-ended)
        q4 = survey.questions[3]
        self.assertEqual(q4.text, "Please describe your experience with our product in detail.")
        self.assertEqual(q4.type, QuestionType.OPEN_ENDED)
        
        # Validate the fifth question (drop-down)
        q5 = survey.questions[4]
        self.assertEqual(q5.text, "Select your country of residence:")
        self.assertEqual(q5.type, QuestionType.DROP_DOWN)
        self.assertEqual(len(q5.options), 6, "Drop-down question should have 6 options")
        self.assertEqual(q5.options[0], "United States")
        self.assertEqual(q5.options[1], "Canada")
        self.assertEqual(q5.options[2], "Mexico")
        self.assertEqual(q5.options[3], "United Kingdom")
        self.assertEqual(q5.options[4], "France")
        self.assertEqual(q5.options[5], "Germany")

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