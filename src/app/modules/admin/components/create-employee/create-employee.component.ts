import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
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

import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

import { UtilsService } from '../../../shared/services/utils.service';
import { EmployeeModel } from '../../../shared/models/employed.model';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-create-employee',
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
  templateUrl: './create-employee.component.html',
  styleUrls: ['./create-employee.component.scss']
})
export class CreateEmployeeComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly utilsService = inject(UtilsService);
  private readonly storage = inject(Storage);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  formGroup: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null; // ✅ NUEVO

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      role: ['', Validators.required],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      imageURL: ['']
    });
  }

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;

      // ✅ Mostrar vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid || !this.selectedFile) {
      this.formGroup.markAllAsTouched();
      if (!this.selectedFile) {
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
    loading.message = 'Guardando empleado...';
    await loading.present();

    try {
      const path = `employee-images/${Date.now()}-${this.selectedFile.name}`;
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, this.selectedFile);
      const imageURL = await getDownloadURL(storageRef);

      const employeeData: EmployeeModel = {
        ...this.formGroup.value,
        imageURL,
        createdAt: new Date()
      };

      await this.employeeService.createEmployee(employeeData);

      await this.utilsService.presentToast({
        message: 'Empleado creado correctamente',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      this.formGroup.reset();
      this.selectedFile = null;
      this.imagePreview = null; // ✅ Limpiar vista previa
      this.setupForm();
      this.toggleOpen();

    } catch (error: any) {
      await this.utilsService.presentToast({
        message: error.message || 'Error al crear empleado',
        duration: 2500,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline'
      });
    } finally {
      loading.dismiss();
    }
  }
}
