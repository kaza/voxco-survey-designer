# Multi-Agent Survey Designer Implementation Plan

## Overview
This document outlines the implementation plan for a multi-agent system designed to help users create and edit surveys. The system uses multiple specialized agents to handle different aspects of survey management.

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
    name: str
    position: int
    survey_id: str
    question_type: QuestionType

@dataclass
class Survey:
    id: str
    name: str
    questions: List[Question]

@dataclass
class SurveyContext:
    current_survey: Optional[Survey] = None
    current_question: Optional[Question] = None
    surveys: List[Survey] = field(default_factory=list)
```

## Agent Architecture

### 1. Triage Agent
- **Purpose**: Initial point of contact and routing
- **Responsibilities**:
  - Present initial options to user
  - Route to appropriate specialized agent
  - Handle basic user interaction
- **Tools**:
  - `list_surveys`: Show available surveys
  - `create_new_survey`: Initiate new survey creation
  - `edit_existing_survey`: Start survey editing process

### 2. Survey Creation Agent
- **Purpose**: Generate new surveys
- **Responsibilities**:
  - Get survey requirements from user
  - Generate appropriate questions
  - Create complete survey structure
- **Tools**:
  - `create_survey`: Create new survey instance
  - `add_question`: Add questions to survey
  - `save_survey`: Persist survey data

### 3. Survey Editor Agent
- **Purpose**: Modify existing surveys
- **Responsibilities**:
  - Show available surveys
  - Handle survey selection
  - Manage question operations
- **Tools**:
  - `list_surveys`: Show available surveys
  - `select_survey`: Choose survey to edit
  - `add_question`: Add new questions
  - `edit_question`: Modify existing questions

### 4. Question Editor Agent
- **Purpose**: Handle individual question modifications
- **Responsibilities**:
  - Modify question parameters
  - Change question types
  - Update question positions
- **Tools**:
  - `edit_question_params`: Update question properties
  - `change_question_type`: Modify question type
  - `update_position`: Change question order

## Implementation Phases

### Phase 1: Foundation
1. Set up project structure
2. Implement data models
3. Create context management system
4. Implement basic validation

### Phase 2: Core Agents
1. Implement Triage Agent
2. Create basic routing system
3. Implement Survey Creation Agent
4. Add basic survey persistence

### Phase 3: Editing Capabilities
1. Implement Survey Editor Agent
2. Add Question Editor Agent
3. Implement question modification tools
4. Add survey listing and selection

### Phase 4: Integration
1. Connect all agents
2. Implement state management
3. Add basic error handling
4. Test complete workflow

## Technical Decisions

### State Management
- Using `SurveyContext` for maintaining state between agent interactions
- Context includes current survey, current question, and list of all surveys
- State is passed through the `RunContextWrapper` system

### Data Persistence
- Initially using in-memory storage
- Future consideration for database integration

### Validation Rules
- Basic validation for required fields
- Question type-specific validation
- Position validation within survey

## Next Steps
1. Create basic project structure
2. Implement data models
3. Set up context management
4. Begin Triage Agent implementation

## Future Considerations
1. Database integration
2. Advanced error handling
3. User authentication
4. Survey templates
5. Export/Import functionality 