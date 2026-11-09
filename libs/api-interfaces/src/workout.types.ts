export interface Exercise {
  id: number;
  name: string;
}

export interface WorkoutExercise {
  id: number;
  exercise: Exercise;
  occurrence: number;
  sets: number;
  reps: number;
  weight: number | null;
  supersetGroup: number | null;
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
