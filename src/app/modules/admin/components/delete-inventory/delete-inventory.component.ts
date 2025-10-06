import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventoryService } from '../../../core/services/inventory.service';
import { UtilsService } from '../../../shared/services/utils.service';
import {
  IonAlert
} from '@ionic/angular/standalone';
import { Inventory } from '../../../shared/models/inventory.model';

@Component({
  selector: 'app-delete-inventory',
  standalone: true,
  imports: [
    CommonModule,
    IonAlert
  ],
  templateUrl: './delete-inventory.component.html',
  styleUrls: ['./delete-inventory.component.scss']
})
export class DeleteInventoryComponent {
  private readonly inventoryService = inject(InventoryService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() inventory: Inventory | null = null;


  alertButtons = [
    {
      text: 'Cancelar',
      role: 'cancel',
      handler: () => { }
    },
    {
      text: 'Aceptar',
      role: 'confirm',
      handler: async () => await this.onDelete()
    }
  ];

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  async onDelete(): Promise<void> {
    if (!this.inventory) return;

    const loading = await this.utilsService.loading();
    await loading.present();

    this.inventoryService.deleteInventory(this.inventory)
      .then(async () => {
        await this.utilsService.presentToast({
          message: 'Inventario eliminado correctamente',
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

  get message(): string {
    if (this.inventory) {
      return `¿Estás seguro que desea eliminar el equipo ${this.inventory.name}?`;
    }
    return '';
  }
}
