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
});
