export interface Exercise {
  id: number;
  name: string;
}

export interface WorkoutExercise {
  exercise: Exercise;
  position: number;
  sets: number;
  repsMin: number;
  repsMax: number;
}

export interface WorkoutSummary {
  id: number;
  name: string;
  description: string | null;
  exerciseCount: number;
}

export interface Workout {
  id: number;
  name: string;
  description: string | null;
  exercises: WorkoutExercise[];
}

export interface WorkoutIdRequest {
  id: number;
}
