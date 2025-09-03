import { TestBed } from '@angular/core/testing';
import { ResultItemComponent } from '@/shared';
import { configureZonelessTestingModule } from '@/test-setup';
import type { ComponentFixture } from '@angular/core/testing';

describe('ResultItemComponent', () => {
  let component: ResultItemComponent;
  let fixture: ComponentFixture<ResultItemComponent>;

  beforeEach(() => {
    configureZonelessTestingModule({
      imports: [ResultItemComponent],
    });

    TestBed.runInInjectionContext(() => {
      fixture = TestBed.createComponent(ResultItemComponent);
      component = fixture.componentInstance;
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('input properties', () => {
    it('should accept required inputs', () => {
      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('label', 'Test Label');
        fixture.componentRef.setInput('value', '100 kcal');
        fixture.componentRef.setInput('description', 'Test description');

        expect(component.label()).toBe('Test Label');
        expect(component.value()).toBe('100 kcal');
        expect(component.description()).toBe('Test description');
      });
    });

    it('should have default isHighlighted as false', () => {
      TestBed.runInInjectionContext(() => {
        expect(component.isHighlighted()).toBeFalse();
      });
    });

    it('should accept isHighlighted input', () => {
      TestBed.runInInjectionContext(() => {
        fixture.componentRef.setInput('isHighlighted', true);

        expect(component.isHighlighted()).toBeTrue();
      });
    });
  });
});
