# Workout Diary Feature Implementation Plan

## Overview
Реализация комплексной системы ведения дневника тренировок с возможностью создания программ тренировок, настройки расписания, выполнения упражнений с отслеживанием прогресса и управления базой данных упражнений.

## Architecture Overview

### FSD Layers Structure
```
src/
├── pages/
│   └── workout-diary/                    # Страница дневника тренировок
├── widgets/
│   ├── next-workout/                     # Обновленный виджет следующей тренировки
│   └── workout-progress/                 # Новый виджет прогресса тренировок
├── features/
│   ├── workout-programs/                 # Управление программами тренировок
│   ├── workout-scheduling/               # Расписание тренировок
│   ├── exercise-execution/               # Выполнение упражнений
│   ├── exercise-database/                # База данных упражнений
│   └── workout-progress-tracking/        # Отслеживание прогресса
├── entities/
│   ├── workout-program/                  # Программа тренировок
│   ├── workout-session/                  # Тренировочная сессия
│   ├── exercise/                         # Упражнение
│   ├── exercise-set/                     # Подход
│   └── super-set/                        # Супер-сет
└── shared/
    ├── services/
    │   ├── workout-storage.service.ts    # Локальное хранение данных
    │   └── exercise-database.service.ts  # Управление базой упражнений
    └── ui/
        ├── exercise-card/                # Карточка упражнения
        ├── set-tracker/                  # Трекер подходов
        ├── super-set-builder/            # Конструктор супер-сетов
        └── workout-timer/                # Таймер тренировки
```

## Data Models

### 1. Workout Program (Программа тренировок)
```typescript
interface WorkoutProgram {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  schedule: WorkoutSchedule[];
  workouts: WorkoutTemplate[];
}

interface WorkoutSchedule {
  id: string;
  programId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  time?: string; // HH:mm format
  workoutTemplateId: string;
  isEnabled: boolean;
}
```

### 2. Workout Template (Шаблон тренировки)
```typescript
interface WorkoutTemplate {
  id: string;
  programId: string;
  name: string;
  description?: string;
  exercises: WorkoutExercise[];
  estimatedDuration: number; // minutes
  restBetweenSets: number; // seconds
  restBetweenExercises: number; // seconds
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  order: number;
  sets: number;
  reps?: number;
  weight?: number;
  restTime?: number; // seconds
  notes?: string;
  alternatives: string[]; // exercise IDs
  isSuperSet: boolean;
  superSetId?: string;
}
```

### 3. Super Set (Супер-сет)
```typescript
interface SuperSet {
  id: string;
  name?: string;
  exercises: string[]; // exercise IDs
  restBetweenExercises: number; // seconds
  restAfterSet: number; // seconds
}
```

### 4. Workout Session (Тренировочная сессия)
```typescript
interface WorkoutSession {
  id: string;
  programId: string;
  templateId: string;
  startTime: Date;
  endTime?: Date;
  status: 'planned' | 'in-progress' | 'completed' | 'skipped';
  exercises: ExerciseExecution[];
  notes?: string;
  rating?: number; // 1-10 difficulty
}

interface ExerciseExecution {
  id: string;
  exerciseId: string;
  sets: SetExecution[];
  notes?: string;
  alternatives?: string[]; // selected alternatives
}

interface SetExecution {
  id: string;
  reps: number;
  weight: number;
  restTime?: number; // actual rest time
  difficulty: number; // 1-10 RPE scale
  completed: boolean;
  completedAt?: Date;
}
```

### 5. Exercise Database (База упражнений)
```typescript
interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  instructions: string[];
  tips?: string[];
  videoUrl?: string;
  imageUrl?: string;
  isCustom: boolean; // user-created exercise
  createdBy?: string; // user ID
  createdAt: Date;
}

interface ExerciseCategory {
  id: string;
  name: string;
  icon?: string;
}

interface MuscleGroup {
  id: string;
  name: string;
  primary: boolean; // primary or secondary muscle
}

interface Equipment {
  id: string;
  name: string;
  required: boolean;
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

#### 1.1 Data Models & Services
- [ ] Create all TypeScript interfaces and types
- [ ] Implement `WorkoutStorageService` for local data persistence
- [ ] Implement `ExerciseDatabaseService` for exercise management
- [ ] Create mock data for development and testing

#### 1.2 Exercise Database Foundation
- [ ] Create exercise database with 100+ common exercises
- [ ] Implement exercise search and filtering
- [ ] Create exercise categories and muscle groups
- [ ] Add equipment tracking

#### 1.3 Basic UI Components
- [ ] `ExerciseCardComponent` - display exercise information
- [ ] `SetTrackerComponent` - track sets, reps, weight, RPE
- [ ] `WorkoutTimerComponent` - rest timer between sets
- [ ] `ExerciseSelectorComponent` - select exercises from database

### Phase 2: Workout Programs Management (Week 3-4)

#### 2.1 Program Creation & Management
- [ ] `WorkoutProgramsPage` - main programs management page
- [ ] `ProgramBuilderComponent` - create/edit workout programs
- [ ] `ProgramListComponent` - display all programs
- [ ] Program CRUD operations

#### 2.2 Workout Templates
- [ ] `WorkoutTemplateBuilderComponent` - create workout templates
- [ ] `ExerciseOrderComponent` - drag & drop exercise ordering
- [ ] `SuperSetBuilderComponent` - create super sets
- [ ] Template validation and preview

#### 2.3 Scheduling System
- [ ] `WorkoutSchedulerComponent` - set up workout schedule
- [ ] `ScheduleCalendarComponent` - visual schedule display
- [ ] Schedule notifications and reminders
- [ ] Automatic workout generation based on schedule

### Phase 3: Workout Execution (Week 5-6)

#### 3.1 Active Workout Interface
- [ ] `ActiveWorkoutPage` - main workout execution interface
- [ ] `ExerciseExecutionComponent` - execute individual exercises
- [ ] `SetExecutionComponent` - track individual sets
- [ ] `WorkoutProgressComponent` - show workout progress

#### 3.2 Super Set Support
- [ ] Super set execution flow
- [ ] Automatic exercise switching
- [ ] Super set progress tracking
- [ ] Rest timer management for super sets

#### 3.3 Alternative Exercises
- [ ] `AlternativeSelectorComponent` - choose exercise alternatives
- [ ] Alternative exercise tracking
- [ ] Custom exercise creation during workout

### Phase 4: Progress Tracking & Analytics (Week 7-8)

#### 4.1 Progress Visualization
- [ ] `WorkoutHistoryComponent` - view past workouts
- [ ] `ProgressChartsComponent` - weight/reps progress charts
- [ ] `VolumeTrackerComponent` - training volume tracking
- [ ] `StrengthProgressionComponent` - strength progression graphs

#### 4.2 Analytics & Insights
- [ ] Workout frequency analysis
- [ ] Exercise performance trends
- [ ] Rest time optimization suggestions
- [ ] Workout completion rate tracking

### Phase 5: Integration & Polish (Week 9-10)

#### 5.1 Dashboard Integration
- [ ] Update `NextWorkoutWidgetComponent` with new data structure
- [ ] Add workout progress widget to dashboard
- [ ] Quick workout start from dashboard
- [ ] Today's workout preview

#### 5.2 Advanced Features
- [ ] Workout templates sharing
- [ ] Import/export workout programs
- [ ] Workout notes and photos
- [ ] Social features (optional)

#### 5.3 Performance & UX
- [ ] Offline support for workout execution
- [ ] Data synchronization
- [ ] Performance optimization
- [ ] Accessibility improvements

## Technical Implementation Details

### State Management
- Use Angular signals for reactive state management
- Implement service-based state for complex data flows
- Use computed signals for derived data (progress, statistics)

### Data Persistence
- Local storage for user data (programs, sessions, custom exercises)
- IndexedDB for large datasets (exercise database, workout history)
- Service worker for offline support

### Routing Structure
```typescript
const WORKOUT_DIARY_ROUTES: Routes = [
  {
    path: '',
    component: WorkoutDiaryPage,
    children: [
      { path: '', redirectTo: 'programs', pathMatch: 'full' },
      { path: 'programs', component: WorkoutProgramsComponent },
      { path: 'programs/new', component: ProgramBuilderComponent },
      { path: 'programs/:id', component: ProgramDetailsComponent },
      { path: 'programs/:id/edit', component: ProgramBuilderComponent },
      { path: 'workout/:id', component: ActiveWorkoutComponent },
      { path: 'history', component: WorkoutHistoryComponent },
      { path: 'exercises', component: ExerciseDatabaseComponent },
      { path: 'progress', component: ProgressAnalyticsComponent }
    ]
  }
];
```

### Service Architecture
```typescript
// Core services
@Injectable({ providedIn: 'root' })
export class WorkoutStorageService {
  // Local storage operations
  saveProgram(program: WorkoutProgram): Observable<void>
  getPrograms(): Observable<WorkoutProgram[]>
  saveSession(session: WorkoutSession): Observable<void>
  getSessions(): Observable<WorkoutSession[]>
}

@Injectable({ providedIn: 'root' })
export class ExerciseDatabaseService {
  // Exercise database operations
  getExercises(): Observable<Exercise[]>
  searchExercises(query: string): Observable<Exercise[]>
  getExerciseById(id: string): Observable<Exercise>
  createCustomExercise(exercise: Exercise): Observable<Exercise>
}

@Injectable({ providedIn: 'root' })
export class WorkoutExecutionService {
  // Active workout management
  startWorkout(templateId: string): Observable<WorkoutSession>
  completeSet(setId: string, data: SetExecution): Observable<void>
  finishWorkout(sessionId: string): Observable<void>
  getActiveWorkout(): Observable<WorkoutSession | null>
}
```

### Component Communication
- Use signals for parent-child communication
- Implement event-driven architecture for complex interactions
- Use services for cross-component state sharing

## Testing Strategy

### Unit Tests
- All services with 80%+ coverage
- Component logic and state management
- Utility functions and data transformations

### Integration Tests
- Workout execution flow
- Data persistence operations
- Component interactions

### E2E Tests
- Complete workout creation and execution
- Program scheduling and management
- Progress tracking accuracy

## Performance Considerations

### Optimization Strategies
- Lazy loading for workout pages
- Virtual scrolling for large exercise lists
- Image optimization for exercise photos
- Efficient data structures for real-time updates

### Memory Management
- Proper RxJS subscription cleanup
- Signal-based state to prevent memory leaks
- Efficient data caching strategies

## Accessibility Features

### WCAG Compliance
- Keyboard navigation for all workout interfaces
- Screen reader support for exercise instructions
- High contrast mode support
- Voice commands for hands-free workout tracking

### Mobile Optimization
- Touch-friendly interface for gym use
- Large buttons for easy interaction
- Offline-first approach for unreliable gym WiFi
- Haptic feedback for set completion

## Future Enhancements

### Phase 6+ Features
- AI-powered workout recommendations
- Integration with fitness trackers
- Social features and community challenges
- Nutrition tracking integration
- Video analysis for form checking
- Personal trainer AI assistant

## Success Metrics

### User Engagement
- Daily active users
- Workout completion rate
- Feature adoption rate
- User retention metrics

### Technical Metrics
- App performance benchmarks
- Data synchronization reliability
- Offline functionality success rate
- Error rates and crash reports

## Risk Mitigation

### Technical Risks
- Data loss prevention with robust backup strategies
- Performance issues with large datasets
- Offline synchronization conflicts

### User Experience Risks
- Complex interface overwhelming users
- Data entry friction during workouts
- Inconsistent workout tracking

## Conclusion

This comprehensive workout diary feature will transform the Strive app into a complete fitness management platform. The phased approach ensures steady progress while maintaining code quality and user experience standards. The modular architecture allows for future enhancements and easy maintenance.

The implementation follows FSD principles, Angular best practices, and maintains consistency with the existing codebase architecture.
