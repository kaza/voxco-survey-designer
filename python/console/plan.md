# Multi-Agent Survey Designer Implementation Plan

## Overview
This document outlines the implementation plan for a multi-agent system designed to help users create and edit surveys. The system uses multiple specialized agents to handle different aspects of survey management, with direct agent-to-agent communication and a CLI interface.

## Project Structure
```
survey_designer/
├── __init__.py
├── main.py
├── models/
│   ├── __init__.py
│   └── survey.py
├── agents/
│   ├── __init__.py
│   ├── triage_agent.py
│   ├── survey_creation_agent.py
│   ├── survey_editor_agent.py
│   └── question_editor_agent.py
├── tools/
│   ├── __init__.py
│   └── survey_tools.py
└── storage/
    ├── __init__.py
    └── json_storage.py
```

## Data Structures

### Core Classes
```python
class QuestionType(Enum):
    RADIO = "Radio"
    OPEN_ENDED = "OpenEnded"
    YES_NO = "YesNo"
    MULTIPLE_CHOICE = "MultipleChoice"
    SINGLE_CHOICE = "SingleChoice"

@dataclass
class Question:
    id: str
    text: str
    type: QuestionType
    position: int
    options: List[str]  # For RADIO, MULTIPLE_CHOICE, SINGLE_CHOICE
    survey_id: Optional[str]

@dataclass
class Survey:
    id: str
    name: str
    description: str
    questions: List[Question]

@dataclass
class SurveyContext:
    current_survey: Optional[Survey] = None
    current_question: Optional[Question] = None
    surveys: List[Survey] = field(default_factory=list)
```

## Implementation Phases

### Phase 1: Foundation
1. **Data Models** (models/survey.py)
   - Implement QuestionType enum
   - Implement Question dataclass
   - Implement Survey dataclass
   - Implement SurveyContext dataclass

2. **Storage System** (storage/json_storage.py)
   - Implement JsonStorage class
   - Basic CRUD operations for surveys
   - JSON serialization/deserialization
   - File-based storage (one survey per file)

### Phase 2: Tools Implementation
1. **Survey Tools** (tools/survey_tools.py)
   - `list_surveys`: Show available surveys
   - `create_survey`: Create new survey
   - `add_question`: Add question to survey
   - `edit_question`: Modify existing question
   - `save_survey`: Persist survey changes
   - `load_survey`: Load survey from storage

### Phase 3: Agent Implementation
1. **Triage Agent** (agents/triage_agent.py)
   - Initial point of contact
   - Direct communication with other agents
   - Basic routing logic
   - Tools: list_surveys

2. **Survey Creation Agent** (agents/survey_creation_agent.py)
   - Survey creation workflow
   - Question type selection
   - Tools: create_survey, add_question, save_survey

3. **Survey Editor Agent** (agents/survey_editor_agent.py)
   - Survey modification workflow
   - Question management
   - Tools: load_survey, save_survey

4. **Question Editor Agent** (agents/question_editor_agent.py)
   - Question modification workflow
   - Question type changes
   - Tools: edit_question

### Phase 4: CLI Interface
1. **Main Application** (main.py)
   - CLI menu system
   - Agent orchestration
   - User interaction handling

## Agent Communication Pattern
- Direct agent-to-agent communication
- Each agent can communicate with any other agent
- Triage agent acts as the main coordinator
- Agents can hand off tasks to each other

## Storage Implementation
- JSON-based file storage
- One survey per file
- Basic file operations (read/write)
- No auto-save (explicit save commands only)

## Validation Rules
- Question structure validation
- Survey structure validation
- Basic error handling for invalid inputs

## Next Steps
1. Review and approve this plan
2. Begin with Phase 1 implementation
3. Implement one component at a time
4. Test each component before moving to the next

## Future Considerations
1. Database integration
2. Advanced error handling
3. User authentication
4. Survey templates
5. Export/Import functionality 