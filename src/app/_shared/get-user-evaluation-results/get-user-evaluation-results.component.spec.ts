import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GetUserEvaluationResultsComponent } from './get-user-evaluation-results.component';

describe('GetUserEvaluationResultsComponent', () => {
  let component: GetUserEvaluationResultsComponent;
  let fixture: ComponentFixture<GetUserEvaluationResultsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GetUserEvaluationResultsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GetUserEvaluationResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
