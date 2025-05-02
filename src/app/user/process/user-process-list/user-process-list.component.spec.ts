import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProcessListComponent } from './user-process-list.component';

describe('UserProcessListComponent', () => {
  let component: UserProcessListComponent;
  let fixture: ComponentFixture<UserProcessListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserProcessListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProcessListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
