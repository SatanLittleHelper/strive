import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { DashboardComponent } from './dashboard.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(() => {
    configureZonelessTestingModule({
      imports: [DashboardComponent],
    });

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display dashboard title', () => {
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('h1, h2, h3');
    expect(titleElement).toBeTruthy();
  });

  it('should render calorie widget', () => {
    fixture.detectChanges();

    const calorieWidget = fixture.nativeElement.querySelector('app-calorie-widget');
    expect(calorieWidget).toBeTruthy();
  });

  it('should render next workout widget', () => {
    fixture.detectChanges();

    const nextWorkoutWidget = fixture.nativeElement.querySelector('app-next-workout-widget');
    expect(nextWorkoutWidget).toBeTruthy();
  });

  it('should calculate tasks count correctly', () => {
    expect(component.tasksCount()).toBe(3);
  });

  it('should calculate completed count correctly', () => {
    expect(component.completedCount()).toBe(2);
  });

  it('should update computed values when tasks change', () => {
    const initialTasksCount = component.tasksCount();
    const initialCompletedCount = component.completedCount();

    expect(initialTasksCount).toBe(3);
    expect(initialCompletedCount).toBe(2);
  });
});
