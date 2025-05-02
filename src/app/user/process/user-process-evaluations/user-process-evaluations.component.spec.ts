import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProcessEvaluationsComponent } from './user-process-evaluations.component';

describe('UserProcessEvaluationsComponent', () => {
  let component: UserProcessEvaluationsComponent;
  let fixture: ComponentFixture<UserProcessEvaluationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserProcessEvaluationsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProcessEvaluationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
