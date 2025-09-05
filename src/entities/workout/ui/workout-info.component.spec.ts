import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import type { WorkoutEntity } from '@/entities/workout';
import { WorkoutInfoComponent } from '@/entities/workout';
import { configureZonelessTestingModule } from '@/test-setup';
import type { ComponentFixture } from '@angular/core/testing';

describe('WorkoutInfoComponent', () => {
  let component: WorkoutInfoComponent;
  let fixture: ComponentFixture<WorkoutInfoComponent>;

  const mockWorkout: WorkoutEntity = {
    id: 1,
    name: 'Morning Workout',
    date: '2024-12-19',
    completedPercent: 75,
  };

  beforeEach(() => {
    configureZonelessTestingModule({
      imports: [WorkoutInfoComponent, DatePipe],
    });

    fixture = TestBed.createComponent(WorkoutInfoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display workout information correctly', () => {
    fixture.componentRef.setInput('workout', mockWorkout);
    fixture.detectChanges();

    const percentElement = fixture.nativeElement.querySelector('.workout-info__percent-circle');
    const nameElement = fixture.nativeElement.querySelector('.workout-info__name');
    const dateElement = fixture.nativeElement.querySelector('.workout-info__date');

    expect(percentElement.textContent.trim()).toBe('75%');
    expect(nameElement.textContent.trim()).toBe('Morning Workout');
    expect(dateElement.textContent.trim()).toBe('19 Dec');
  });

  it('should apply correct CSS class for 0% completion', () => {
    const workoutWithZero = { ...mockWorkout, completedPercent: 0 };
    fixture.componentRef.setInput('workout', workoutWithZero);
    fixture.detectChanges();

    const percentElement = fixture.nativeElement.querySelector('.workout-info__percent-circle');
    expect(percentElement.className).toContain('workout-info__percent-circle--default');
  });

  it('should apply correct CSS class for success (>80%)', () => {
    const workoutWithSuccess = { ...mockWorkout, completedPercent: 85 };
    fixture.componentRef.setInput('workout', workoutWithSuccess);
    fixture.detectChanges();

    const percentElement = fixture.nativeElement.querySelector('.workout-info__percent-circle');
    expect(percentElement.className).toContain('workout-info__percent-circle--success');
  });

  it('should apply correct CSS class for warning (25-80%)', () => {
    const workoutWithWarning = { ...mockWorkout, completedPercent: 50 };
    fixture.componentRef.setInput('workout', workoutWithWarning);
    fixture.detectChanges();

    const percentElement = fixture.nativeElement.querySelector('.workout-info__percent-circle');
    expect(percentElement.className).toContain('workout-info__percent-circle--warning');
  });

  it('should apply correct CSS class for error (<25%)', () => {
    const workoutWithError = { ...mockWorkout, completedPercent: 20 };
    fixture.componentRef.setInput('workout', workoutWithError);
    fixture.detectChanges();

    const percentElement = fixture.nativeElement.querySelector('.workout-info__percent-circle');
    expect(percentElement.className).toContain('workout-info__percent-circle--error');
  });

  it('should handle edge case percentages correctly', () => {
    const testCases = [
      { percent: 25, expectedClass: 'workout-info__percent-circle--error' },
      { percent: 26, expectedClass: 'workout-info__percent-circle--warning' },
      { percent: 80, expectedClass: 'workout-info__percent-circle--warning' },
      { percent: 81, expectedClass: 'workout-info__percent-circle--success' },
      { percent: 100, expectedClass: 'workout-info__percent-circle--success' },
    ];

    testCases.forEach(({ percent, expectedClass }) => {
      const workoutWithPercent = { ...mockWorkout, completedPercent: percent };
      fixture.componentRef.setInput('workout', workoutWithPercent);
      fixture.detectChanges();

      const percentElement = fixture.nativeElement.querySelector('.workout-info__percent-circle');
      expect(percentElement.className).toContain(expectedClass);
    });
  });
});
