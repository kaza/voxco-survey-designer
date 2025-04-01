# Multi-Agent Survey Designer Implementation Plan

## Overview
This document outlines the implementation plan for a multi-agent system designed to help users create and edit surveys. The system uses OpenAI's Agent SDK to coordinate specialized agents that handle different aspects of survey management, with a CLI interface for user interaction.

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
│   ├── survey_generator_agent.py
│   └── survey_editor_agent.py
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
   - Add validation methods for data integrity

2. **Storage System** (storage/json_storage.py)
   - Implement JsonStorage class with auto-save functionality
   - Basic CRUD operations for surveys
   - JSON serialization/deserialization with error handling
   - File-based storage (one survey per file)
   - Implement backup/restore functionality

### Phase 2: Tools Implementation
1. **Survey Tools** (tools/survey_tools.py)
   - `list_surveys`: Show available surveys with metadata
   - `create_survey`: Create new survey with validation
   - `add_question`: Add question to survey with type validation
   - `edit_question`: Modify existing question with validation
   - `delete_question`: Remove question from survey
   - `save_survey`: Explicit save command (in addition to auto-save)
   - `load_survey`: Load survey from storage with error handling
   - `validate_survey`: Comprehensive survey validation

### Phase 3: Agent Implementation
1. **Triage Agent** (agents/triage_agent.py)
   - Initial point of contact using OpenAI's Agent SDK
   - Smart routing logic based on user intent
   - Tools: list_surveys
   - Handoffs to Survey Generator and Survey Editor agents
   - Error handling and recovery

2. **Survey Generator Agent** (agents/survey_generator_agent.py)
   - Survey creation workflow using OpenAI's Agent SDK
   - Natural language processing for survey creation
   - Question type inference and validation
   - Tools: create_survey, add_question, save_survey
   - Auto-save after each question addition
   - Error recovery and validation

3. **Survey Editor Agent** (agents/survey_editor_agent.py)
   - Comprehensive survey modification workflow
   - Question management (add/edit/delete)
   - Question type changes with validation
   - Tools: load_survey, save_survey, edit_question, delete_question
   - Auto-save after each modification
   - Error handling and recovery
   - State management for editing session

### Phase 4: CLI Interface
1. **Main Application** (main.py)
   - CLI menu system with rich text formatting
   - Agent orchestration using OpenAI's Agent SDK
   - User interaction handling with error recovery
   - Progress indicators and status updates
   - Session management and state persistence

## Agent Communication Pattern
- Uses OpenAI's Agent SDK for agent orchestration
- Structured handoffs between agents
- Triage agent acts as the main coordinator
- Agents communicate through SDK's handoff mechanism
- State management through SurveyContext

## Storage Implementation
- JSON-based file storage with auto-save
- One survey per file
- Automatic backup creation
- Error handling and recovery
- Explicit save command available
- File locking for concurrent access

## Validation Rules
- Question structure validation
- Survey structure validation
- Question type validation
- Option validation for choice questions
- Comprehensive error handling
- Input sanitization
- State validation

## Error Handling
- Graceful error recovery
- User-friendly error messages
- Automatic state recovery
- Backup/restore functionality
- Logging and monitoring
- Session recovery

## Next Steps
1. Review and approve this updated plan
2. Begin with Phase 1 implementation
3. Implement one component at a time
4. Test each component before moving to the next
5. Add comprehensive error handling
6. Implement auto-save functionality
7. Add validation and recovery mechanisms

## Future Considerations
1. Database integration
2. Advanced error handling
3. User authentication
4. Survey templates
5. Export/Import functionality
6. Collaborative editing
7. Version control
8. Analytics and reporting 