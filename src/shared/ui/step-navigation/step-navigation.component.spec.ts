import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { StepNavigationComponent, type StepConfig } from './step-navigation.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('StepNavigationComponent', () => {
  let component: StepNavigationComponent;
  let fixture: ComponentFixture<StepNavigationComponent>;

  beforeEach(() => {
    configureZonelessTestingModule({
      imports: [StepNavigationComponent],
    });

    fixture = TestBed.createComponent(StepNavigationComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('step navigation', () => {
    it('should emit stepClick when step is clicked', () => {
      const steps: StepConfig[] = [
        { title: 'Step 1' },
        { title: 'Step 2', disabled: true },
        { title: 'Step 3' },
      ];

      fixture.componentRef.setInput('steps', steps);
      fixture.componentRef.setInput('activeStepIndex', 0);
      fixture.detectChanges();

      spyOn(component.stepClick, 'emit');

      const stepButtons = fixture.debugElement.nativeElement.querySelectorAll('button[tuiTab]');
      stepButtons[0].click();

      expect(component.stepClick.emit).toHaveBeenCalledWith(0);
    });

    it('should not emit stepClick when disabled step is clicked', () => {
      const steps: StepConfig[] = [{ title: 'Step 1' }, { title: 'Step 2', disabled: true }];

      fixture.componentRef.setInput('steps', steps);
      fixture.componentRef.setInput('activeStepIndex', 0);
      fixture.detectChanges();

      spyOn(component.stepClick, 'emit');

      const stepButtons = fixture.debugElement.nativeElement.querySelectorAll('button[tuiTab]');
      stepButtons[1].click();

      expect(component.stepClick.emit).not.toHaveBeenCalled();
    });

    it('should render all steps with correct titles', () => {
      const steps: StepConfig[] = [
        { title: 'Basic Information' },
        { title: 'Activity & Goal' },
        { title: 'Results' },
      ];

      fixture.componentRef.setInput('steps', steps);
      fixture.componentRef.setInput('activeStepIndex', 1);
      fixture.detectChanges();

      const stepButtons = fixture.debugElement.nativeElement.querySelectorAll('button[tuiTab]');

      expect(stepButtons.length).toBe(3);
      expect(stepButtons[0].textContent.trim()).toBe('Basic Information');
      expect(stepButtons[1].textContent.trim()).toBe('Activity & Goal');
      expect(stepButtons[2].textContent.trim()).toBe('Results');
    });

    it('should set correct active step index', () => {
      const steps: StepConfig[] = [{ title: 'Step 1' }, { title: 'Step 2' }, { title: 'Step 3' }];

      fixture.componentRef.setInput('steps', steps);
      fixture.componentRef.setInput('activeStepIndex', 2);
      fixture.detectChanges();

      const tabsElement = fixture.debugElement.nativeElement.querySelector('tui-tabs');
      expect(tabsElement.getAttribute('ng-reflect-active-item-index')).toBe('2');
    });
  });
});
