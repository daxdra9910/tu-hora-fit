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

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  form: FormGroup;
  selectedFile: File | null = null;
  selectedFileError = false;

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
    }
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.selectedFile) {
      this.form.markAllAsTouched();
      if (!this.selectedFile) {
        this.selectedFileError = true;
      }
      return;
    }

    const inventoryData: Inventory = {
      ...this.form.value,
      photoURL: '', // 🔵 más adelante, cuando subamos la imagen a Firebase
      createdAt: new Date()
    };

    const loading = await this.utilsService.loading();
    await loading.present();

    this.inventoryService.createInventory(inventoryData)
      .then(async () => {
        await this.utilsService.presentToast({
          message: 'Inventario creado correctamente (sin imagen subida aún)',
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
