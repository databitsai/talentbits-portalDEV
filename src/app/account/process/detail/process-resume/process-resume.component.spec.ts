import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessResumeComponent } from './process-resume.component';

describe('ProcessResumeComponent', () => {
  let component: ProcessResumeComponent;
  let fixture: ComponentFixture<ProcessResumeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcessResumeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessResumeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
