import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonRow,
  IonSearchbar,
  IonText,
  IonTitle,
  IonToolbar,
  IonAvatar, IonLabel } from '@ionic/angular/standalone';

import { CreateInventoryComponent } from '../../components/create-inventory/create-inventory.component';
import { ModifyInventoryComponent } from '../../components/modify-inventory/modify-inventory.component';
import { DeleteInventoryComponent } from '../../components/delete-inventory/delete-inventory.component';
import { Inventory } from '../../../shared/models/inventory.model';
import { InventoryService } from '../../../core/services/inventory.service';
import { UtilsService } from '../../../shared/services/utils.service';

@Component({
  selector: 'app-inventory',
  templateUrl: './inventory.page.html',
  styleUrls: ['./inventory.page.scss'],
  standalone: true,
  imports: [IonLabel, IonAvatar,
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItemSliding,
    IonSearchbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonText,
    IonList,
    IonItemOptions,
    IonItemOption,
    IonItem,
    IonCol,
    IonGrid,
    IonRow,
    CreateInventoryComponent,
    ModifyInventoryComponent,
    DeleteInventoryComponent
  ]
})
export class InventoryPage implements OnInit {
  private readonly inventoryService = inject(InventoryService);
  private readonly utilsService = inject(UtilsService);

  @ViewChild('inventoryList') inventoryList!: IonList;

  inventories: Inventory[] = [];
  selectedInventory: Inventory | null = null;

  isCreating = false;
  isEditing = false;
  isDeleting = false;

  ngOnInit() {
    this.getInventories();
  }

  async getInventories(name: string = '') {
    const loading = await this.utilsService.loading();
    await loading.present();

    this.inventoryService.getAllInventories()
      .then(data => {
        if (name.trim()) {
          this.inventories = data.filter(inv =>
            inv.name.toLowerCase().includes(name.toLowerCase())
          );
        } else {
          this.inventories = data;
        }
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

  handleInput(event: Event) {
    const target = event.target as HTMLIonSearchbarElement;
    const query = target.value || '';
    this.getInventories(query);
  }

  openCreate() {
    this.isCreating = true;
  }

  closeCreate() {
    this.isCreating = false;
    this.getInventories();
  }

  openEdit(inventory: Inventory) {
    this.inventoryList?.closeSlidingItems().then(() => {
      this.selectedInventory = inventory;
      this.isEditing = true;
    });
  }

  closeEdit() {
    this.isEditing = false;
    this.selectedInventory = null;
    this.getInventories();
  }

  openDelete(inventory: Inventory) {
    this.inventoryList?.closeSlidingItems().then(() => {
      this.selectedInventory = inventory;
      this.isDeleting = true;
    });
  }

  closeDelete() {
    this.isDeleting = false;
    this.selectedInventory = null;
    this.getInventories();
  }
}
