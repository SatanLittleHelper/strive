import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { NextWorkoutWidgetComponent } from '@/widgets';
import type { ComponentFixture } from '@angular/core/testing';

describe('NextWorkoutWidgetComponent', () => {
  let component: NextWorkoutWidgetComponent;
  let fixture: ComponentFixture<NextWorkoutWidgetComponent>;

  beforeEach(() => {
    configureZonelessTestingModule({
      imports: [NextWorkoutWidgetComponent],
    });

    fixture = TestBed.createComponent(NextWorkoutWidgetComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title correctly', () => {
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('.next-workout-widget__title');
    expect(titleElement.textContent.trim()).toBe('Next Workout');
  });

  it('should have workouts signal with 3 items', () => {
    fixture.detectChanges();

    expect(component.workouts().length).toBe(3);
  });

  it('should have correct workout data in signal', () => {
    fixture.detectChanges();

    const workouts = component.workouts();
    expect(workouts[0].name).toBe('Push Day');
    expect(workouts[1].name).toBe('Pull Day');
    expect(workouts[2].name).toBe('Legs');
  });

  it('should maintain widget structure', () => {
    fixture.detectChanges();

    const widgetElement = fixture.nativeElement.querySelector('.next-workout-widget');
    const listElement = fixture.nativeElement.querySelector('.next-workout-widget__list');

    expect(widgetElement).toBeTruthy();
    expect(listElement).toBeTruthy();
    expect(listElement.children.length).toBe(3);
  });
});
