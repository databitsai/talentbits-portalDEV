import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProcessEvaluationsComponent } from './process-evaluations.component';

describe('ProcessEvaluationsComponent', () => {
  let component: ProcessEvaluationsComponent;
  let fixture: ComponentFixture<ProcessEvaluationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProcessEvaluationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessEvaluationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
