"""
Constants used throughout the survey designer application.
"""

QUESTION_TYPES_INFO = """
Available question types with structure and options:

- RADIO:
  Single-answer question using radio buttons.
  Structure:
    - Label (question text)
    - List of options
  Options:
    - Randomize choices (optional)
    - Include 'Other' with input (optional)
    - Required or optional

- MULTIPLE_CHOICE:
  Multiple-answer question using checkboxes.
  Structure:
    - Label
    - List of checkbox options
  Options:
    - Min/max selections
    - Randomize choices
    - 'None of the above' logic

- OPEN_ENDED:
  Open-ended text response.
  Structure:
    - Label
    - Text input (single or multiline)
  Options:
    - Validation rules (length, format, etc.)
    - Required or optional

- DROP_DOWN:
  Single-answer from a compact drop-down menu.
  Structure:
    - Label
    - List of choices
  Options:
    - Placeholder/default
    - Randomize or alphabetize

- NUMERIC:
  Numeric input for quantities or values.
  Structure:
    - Label
    - Input field
  Options:
    - Min/max value
    - Integer or decimal
    - Units (e.g., $, years)

- RATING:
  Rating scale using stars or slider.
  Structure:
    - Label
    - Scale (e.g., 1–5 or 0–10)
  Options:
    - Visual style (stars, slider)
    - Labeled endpoints (e.g., Poor–Excellent)
"""
