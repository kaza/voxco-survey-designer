import secrets
from typing import Dict
from models import Survey, Block, Question

# In-memory storage for surveys
SURVEY_DB: Dict[str, Survey] = {}

def generate_id() -> str:
    """Generates a unique 6-character hexadecimal ID."""
    return secrets.token_hex(3)

# --- Sample Survey 1 ---
survey1_id = generate_id()
survey1 = Survey(
    id=survey1_id,
    title="Customer Satisfaction Survey",
    blocks=[
        Block(
            id=generate_id(),
            position=0,
            questions=[
                Question(id=generate_id(), text="How satisfied are you with our service?", position=0),
                Question(id=generate_id(), text="Would you recommend us to a friend?", position=1),
            ]
        ),
        Block(
            id=generate_id(),
            position=1,
            questions=[
                Question(id=generate_id(), text="What did you like most?", position=0),
                Question(id=generate_id(), text="How can we improve?", position=1),
            ]
        )
    ]
)

# --- Sample Survey 2 ---
survey2_id = generate_id()
survey2 = Survey(
    id=survey2_id,
    title="Employee Feedback Survey",
    blocks=[
        Block(
            id=generate_id(),
            position=0,
            questions=[
                Question(id=generate_id(), text="Do you feel valued at work?", position=0),
                Question(id=generate_id(), text="Are you satisfied with your work-life balance?", position=1),
            ]
        ),
        Block(
            id=generate_id(),
            position=1,
            questions=[
                Question(id=generate_id(), text="What opportunities for growth do you see?", position=0),
                Question(id=generate_id(), text="Any suggestions for team activities?", position=1),
            ]
        )
    ]
)

# Populate the database
SURVEY_DB[survey1_id] = survey1
SURVEY_DB[survey2_id] = survey2

print(f"Initialized SURVEY_DB with {len(SURVEY_DB)} surveys.") 