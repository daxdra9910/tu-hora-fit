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
import { EmployeeModel, EmployeeModelWithFile } from '../../../shared/models/employed.model';
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

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      role: ['', Validators.required],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      image: [null, Validators.required]
    });
  }

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.formGroup.patchValue({ image: file });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    const employeeData: EmployeeModelWithFile = {
      ...this.formGroup.value
    };

    this.employeeService.createEmployee(employeeData)
      .then(() => {
        this.utilsService.presentToast({
          message: 'Empleado creado correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        this.formGroup.reset();
        this.toggleOpen();
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: error.message || 'Error al crear empleado',
          duration: 2500,
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }

  get imagePreview(): string | null {
    const file = this.formGroup.get('image')?.value as File | null;
    return file ? URL.createObjectURL(file) : null;
  }
}
