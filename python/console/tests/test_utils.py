import logging
import os
import sys
import tempfile
import shutil
from dotenv import load_dotenv

# Add the parent directory to sys.path to fix imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from models import SurveyContext
from tools import SurveyTools
from json_storage import JsonStorage
import agent_tools

# Configure logging for OpenAI Agents SDK
def setup_logging():
    # Configure logging for all loggers
    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler()
        ]
    )
    
    # Set up specific loggers
    loggers = [
        "openai.agents",  # Main agents logger
        "openai.agents.tracing",  # Tracing logs
        "__main__",  # Main module
        "agent_tools",  # Our agent tools
        "test_survey_generator",  # Our test module
    ]
    
    for logger_name in loggers:
        logger = logging.getLogger(logger_name)
        logger.setLevel(logging.DEBUG)
        
    return logging.getLogger("openai.agents")

# Load environment variables
load_dotenv()

# Base test class with common setup
class BaseAgentTest:
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