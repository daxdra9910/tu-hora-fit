import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InventoryPage } from './inventory.page';

describe('InventoryPage', () => {
  let component: InventoryPage;
  let fixture: ComponentFixture<InventoryPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [InventoryPage],
    }).compileComponents();

    fixture = TestBed.createComponent(InventoryPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
