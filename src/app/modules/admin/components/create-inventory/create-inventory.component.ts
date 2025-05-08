import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
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

import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-create-inventory',
  standalone: true,
  imports: [
    IonLabel,
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
  templateUrl: './create-inventory.component.html',
  styleUrls: ['./create-inventory.component.scss']
})
export class CreateInventoryComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly inventoryService = inject(InventoryService);
  private readonly utilsService = inject(UtilsService);
  private readonly storage = inject(Storage);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  form: FormGroup;
  selectedFile: File | null = null;
  selectedFileError = false;
  imagePreview: string | ArrayBuffer | null = null;

  ngOnInit() {
    this.setupForm();
  }

  setupForm() {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileError = false;

      // Mostrar vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.selectedFile) {
      this.form.markAllAsTouched();
      if (!this.selectedFile) {
        this.selectedFileError = true;
        await this.utilsService.presentToast({
          message: 'Debe seleccionar una imagen',
          duration: 2500,
          color: 'danger',
          position: 'bottom',
          icon: 'alert-circle-outline'
        });
      }
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      // Subir la imagen
      const path = `inventory-images/${Date.now()}-${this.selectedFile.name}`;
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, this.selectedFile);
      const photoURL = await getDownloadURL(storageRef);

      // Guardar en Firestore
      const inventoryData: Inventory = {
        ...this.form.value,
        photoURL,
        createdAt: new Date()
      };

      await this.inventoryService.createInventory(inventoryData);

      await this.utilsService.presentToast({
        message: 'Inventario creado correctamente',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      // Resetear
      this.toggleOpen();
      this.form.reset();
      this.setupForm();
      this.selectedFile = null;
      this.imagePreview = null;

    } catch (error: any) {
      await this.utilsService.presentToast({
        message: error.message || 'Error al crear inventario',
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
