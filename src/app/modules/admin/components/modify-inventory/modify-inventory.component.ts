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
  IonLabel,
  IonAvatar,
} from '@ionic/angular/standalone';
import { Inventory } from '../../../shared/models/inventory.model';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Storage } from '@angular/fire/storage';

@Component({
  selector: 'app-modify-inventory',
  standalone: true,
  imports: [
    IonAvatar,
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
    IonText,
    IonLabel,
  ],
  templateUrl: './modify-inventory.component.html',
  styleUrls: ['./modify-inventory.component.scss']
})
export class ModifyInventoryComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryService);
  private readonly utilsService = inject(UtilsService);
  private readonly storage = inject(Storage);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() inventory: Inventory | null = null;

  formGroup: FormGroup;
  selectedFile: File | null = null;

  constructor() {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      photoURL: ['']
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['inventory'] && this.inventory) {
      this.formGroup.patchValue({
        name: this.inventory.name,
        quantity: this.inventory.quantity,
        photoURL: this.inventory.photoURL || ''
      });
    }
  }

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid || !this.inventory) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      let photoURL = this.inventory.photoURL;

      if (this.selectedFile) {
        // 🔥 Eliminar imagen anterior si existe
        if (photoURL) {
          try {
            const oldImageRef = storageRef(this.storage, photoURL);
            await deleteObject(oldImageRef);
            console.log('✅ Imagen anterior eliminada');
          } catch (err) {
            console.warn('⚠️ No se pudo eliminar la imagen anterior', err);
          }
        }

        // 🔼 Subir nueva imagen
        const newPath = `inventory-images/${Date.now()}-${this.selectedFile.name}`;
        const newStorageRef = storageRef(this.storage, newPath);
        await uploadBytes(newStorageRef, this.selectedFile);
        photoURL = await getDownloadURL(newStorageRef);
      }

      const updatedInventory: Inventory = {
        ...this.inventory,
        ...this.formGroup.value,
        photoURL
      };

      await this.inventoryService.updateInventory(updatedInventory);

      await this.utilsService.presentToast({
        message: 'Inventario actualizado correctamente',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      this.toggleOpen();
    } catch (error: any) {
      await this.utilsService.presentToast({
        message: error.message || 'Error al actualizar inventario',
        duration: 2500,
        color: 'danger',
        position: 'bottom',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }
}
