import unittest
import sys
import logging
from test_utils import setup_logging

def run_tests():
    # Set up logging first
    setup_logging()
    
    # Disable other common noisy loggers
    for logger_name in ["urllib3", "asyncio", "matplotlib"]:
        logging.getLogger(logger_name).setLevel(logging.WARNING)
    
    # Get command line arguments (test files to run)
    if len(sys.argv) > 1:
        test_files = sys.argv[1:]
        test_suite = unittest.defaultTestLoader.discover('.', pattern=f"*{test_files[0].split('/')[-1]}")
    else:
        # If no arguments, run all tests
        test_suite = unittest.defaultTestLoader.discover('.', pattern="test_*.py")
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Return appropriate exit code
    return 0 if result.wasSuccessful() else 1

if __name__ == "__main__":
    sys.exit(run_tests()) 