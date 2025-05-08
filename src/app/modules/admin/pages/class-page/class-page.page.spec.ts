import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassPagePage } from './class-page.page';

describe('ClassPagePage', () => {
  let component: ClassPagePage;
  let fixture: ComponentFixture<ClassPagePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassPagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
