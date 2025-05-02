import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuCorporativeComponent } from './menu-corporative.component';

describe('MenuCorporativeComponent', () => {
  let component: MenuCorporativeComponent;
  let fixture: ComponentFixture<MenuCorporativeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MenuCorporativeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MenuCorporativeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
