import unittest
import asyncio
import logging
from agents import Runner, RunContextWrapper
from survey_agents import survey_triage
from test_utils import setup_logging, BaseAgentTest
from models import SurveyContext
from agent_tools import create_survey, add_question

# Setup logging
logger = logging.getLogger(__name__)
setup_logging()

class TestSurveyGenerator(BaseAgentTest, unittest.TestCase):
    def test_survey_context_creates_survey(self):
        """Test that survey_triage creates a survey in the context."""
        # Create a message that will trigger survey creation
        message = "Create a new survey about customer satisfaction"

        # Run the triage agent with the message and get back the context
        result, context = asyncio.run(self._run_triage(message))
        
        # Check that we got a response
        self.assertIsNotNone(result)
        logger.info(f"### Got result: {result}")
        
        # Verify that SurveyContext exists
        self.assertIsNotNone(context, "SurveyContext should exist")
        
        # Verify that the context has one survey
        self.assertEqual(len(context.surveys), 1, "Context should have one survey")
        
        # Verify that the current_survey is set
        self.assertIsNotNone(context.current_survey, "Context should have current_survey set")
        
        # Verify that current_survey is the same as the first survey in the list
        self.assertEqual(context.current_survey.id, context.surveys[0].id, 
                        "current_survey should be the same as the first survey in the list")
        
        # Verify that the survey has the right properties
        survey = context.surveys[0]
        self.assertIsNotNone(survey.id, "Survey should have an ID")
        self.assertIsNotNone(survey.name, "Survey should have a name")
        self.assertIsNotNone(survey.description, "Survey should have a description")
        
        # Verify that the survey has 0 questions initially
        if context.surveys:
            logger.debug(f"### Survey ID: {context.surveys[0].id}")
            logger.debug(f"### Survey name: {context.surveys[0].name}")
            logger.debug(f"### Survey description: {context.surveys[0].description}")
            logger.debug(f"### Questions in survey: {len(context.surveys[0].questions)}")
        
        self.assertEqual(len(context.surveys[0].questions), 0, "Survey should have 0 questions initially")
        
    async def _run_triage(self, user_input):
        """Run the survey triage agent with the given input and return both the result and context."""
        # Create a fresh SurveyContext instance
        survey_context = SurveyContext()
        
        # Run the survey triage agent with the input
        result = await Runner.run(
            starting_agent=survey_triage, 
            input=user_input,
            context=survey_context
        )
        
        # Return both the result and the context
        return result, survey_context

if __name__ == "__main__":
    unittest.main() 