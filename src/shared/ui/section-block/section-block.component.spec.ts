import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { SectionBlockComponent } from './section-block.component';
import type { ComponentFixture } from '@angular/core/testing';

describe('SectionBlockComponent', () => {
  let component: SectionBlockComponent;
  let fixture: ComponentFixture<SectionBlockComponent>;

  beforeEach(async () => {
    configureZonelessTestingModule({
      imports: [SectionBlockComponent],
    });

    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(SectionBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render title when provided', () => {
    fixture.componentRef.setInput('title', 'Test Title');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test Title');
  });

  it('should not render title when not provided', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('.section-block__title');
    expect(titleElement).toBeNull();
  });

  it('should render content', () => {
    fixture = TestBed.createComponent(SectionBlockComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const contentElement = compiled.querySelector('.section-block__content');
    expect(contentElement).toBeTruthy();
  });
});
