import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAccountAdministratorComponent } from './create-account-administrator.component';

describe('CreateAccountAdministratorComponent', () => {
  let component: CreateAccountAdministratorComponent;
  let fixture: ComponentFixture<CreateAccountAdministratorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateAccountAdministratorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAccountAdministratorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
