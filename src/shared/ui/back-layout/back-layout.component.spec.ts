import { TestBed } from '@angular/core/testing';
import { BackLayoutComponent } from '@/shared';
import { configureZonelessTestingModule } from '@/test-setup';
import type { ComponentFixture } from '@angular/core/testing';

describe('BackLayoutComponent', () => {
  let component: BackLayoutComponent;
  let fixture: ComponentFixture<BackLayoutComponent>;

  beforeEach(() => {
    configureZonelessTestingModule({
      imports: [BackLayoutComponent],
    });

    fixture = TestBed.createComponent(BackLayoutComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render back layout structure', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.back-layout')).toBeTruthy();
    expect(compiled.querySelector('.back-layout__content')).toBeTruthy();
  });

  it('should project content correctly', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.back-layout__content')).toBeTruthy();
  });

  it('should have correct CSS classes', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const backLayout = compiled.querySelector('.back-layout');
    const content = compiled.querySelector('.back-layout__content');

    expect(backLayout).toBeTruthy();
    expect(content).toBeTruthy();
  });
});
