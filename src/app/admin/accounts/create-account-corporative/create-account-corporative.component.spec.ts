import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAccountCorporativeComponent } from './create-account-corporative.component';

describe('CreateAccountCorporativeComponent', () => {
  let component: CreateAccountCorporativeComponent;
  let fixture: ComponentFixture<CreateAccountCorporativeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateAccountCorporativeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAccountCorporativeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
