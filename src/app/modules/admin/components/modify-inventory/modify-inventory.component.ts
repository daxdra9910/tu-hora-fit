import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InventoryService } from '../../../core/services/inventory.service';
import { UtilsService } from '../../../shared/services/utils.service';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonList,
  IonModal,
  IonText,
  IonTitle,
  IonToolbar,
  IonLabel
} from '@ionic/angular/standalone';
import { Inventory } from '../../../shared/models/inventory.model';

@Component({
  selector: 'app-modify-inventory',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonText
  ],
  templateUrl: './modify-inventory.component.html',
  styleUrls: ['./modify-inventory.component.scss']
})
export class ModifyInventoryComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() inventory: Inventory | null = null; // 🚨 Aquí recibimos el inventario seleccionado

  formGroup: FormGroup;

  constructor() {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  // 🚨 Aquí capturamos cuando inventory cambia
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inventory'] && this.inventory) {
      this.formGroup.patchValue({
        name: this.inventory.name,
        quantity: this.inventory.quantity
      });
    }
  }

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid || !this.inventory) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const updatedInventory: Inventory = {
      ...this.inventory,
      ...this.formGroup.value
    };

    const loading = await this.utilsService.loading();
    await loading.present();

    this.inventoryService.updateInventory(updatedInventory)
      .then(async () => {
        await this.utilsService.presentToast({
          message: 'Inventario actualizado correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        this.toggleOpen();
      })
      .catch(async (error) => {
        await this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'bottom',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }
}
