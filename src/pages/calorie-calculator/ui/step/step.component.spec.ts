import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { StepComponent } from './step.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('StepComponent', () => {
  let component: StepComponent;
  let fixture: ComponentFixture<StepComponent>;

  beforeEach(() => {
    configureZonelessTestingModule({
      imports: [StepComponent],
    });

    fixture = TestBed.createComponent(StepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display title input', () => {
    const testTitle = 'Test Step Title';
    fixture.componentRef.setInput('title', testTitle);
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('.step__title');
    expect(titleElement.textContent.trim()).toBe(testTitle);
  });

  it('should render ng-content structure', () => {
    const testTitle = 'Test Title';
    fixture.componentRef.setInput('title', testTitle);
    fixture.detectChanges();

    const titleElement = fixture.nativeElement.querySelector('.step__title');
    expect(titleElement.textContent.trim()).toBe(testTitle);

    const stepElement = fixture.nativeElement.querySelector('.step');
    expect(stepElement).toBeTruthy();
    expect(stepElement.children.length).toBe(1);
  });
});
