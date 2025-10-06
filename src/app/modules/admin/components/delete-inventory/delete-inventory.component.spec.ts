import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DeleteInventoryComponent } from './delete-inventory.component';

describe('DeleteInventoryComponent', () => {
  let component: DeleteInventoryComponent;
  let fixture: ComponentFixture<DeleteInventoryComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [DeleteInventoryComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DeleteInventoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
