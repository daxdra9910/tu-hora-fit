import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  IonAvatar
} from '@ionic/angular/standalone';

import { Storage } from '@angular/fire/storage';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

import { EmployeeService } from '../../../core/services/employee.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { EmployeeModel } from '../../../shared/models/employed.model';

@Component({
  selector: 'app-modify-employee',
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
    IonLabel,
    IonAvatar
  ],
  templateUrl: './modify-employee.component.html',
  styleUrls: ['./modify-employee.component.scss']
})
export class ModifyEmployeeComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly utilsService = inject(UtilsService);
  private readonly storage = inject(Storage);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() employeeData: EmployeeModel | null = null;

  formGroup: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

  constructor() {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      role: ['', Validators.required],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      imageURL: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeData'] && this.employeeData) {
      this.formGroup.patchValue({
        name: this.employeeData.name,
        role: this.employeeData.role,
        phone: this.employeeData.phone,
        email: this.employeeData.email,
        imageURL: this.employeeData.imageURL
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

      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid || !this.employeeData) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      let imageURL = this.employeeData.imageURL;

      if (this.selectedFile) {
        // 🧹 Eliminar imagen anterior
        if (imageURL) {
          try {
            const oldRef = storageRef(this.storage, imageURL);
            await deleteObject(oldRef);
          } catch (error) {
            console.warn('No se pudo eliminar la imagen anterior:', error);
          }
        }

        const path = `employee-images/${Date.now()}-${this.selectedFile.name}`;
        const newRef = storageRef(this.storage, path);
        await uploadBytes(newRef, this.selectedFile);
        imageURL = await getDownloadURL(newRef);
      }

      const updatedEmployee: EmployeeModel = {
        ...this.employeeData,
        ...this.formGroup.value,
        imageURL
      };

      await this.employeeService.updateEmployee(updatedEmployee, this.employeeData.imageURL);

      await this.utilsService.presentToast({
        message: 'Empleado actualizado correctamente',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      this.toggleOpen();
    } catch (error: any) {
      await this.utilsService.presentToast({
        message: error.message || 'Error al actualizar empleado',
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
