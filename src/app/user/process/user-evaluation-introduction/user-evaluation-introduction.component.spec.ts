import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserEvaluationIntroductionComponent } from './user-evaluation-introduction.component';

describe('UserEvaluationIntroductionComponent', () => {
  let component: UserEvaluationIntroductionComponent;
  let fixture: ComponentFixture<UserEvaluationIntroductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserEvaluationIntroductionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserEvaluationIntroductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
