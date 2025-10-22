import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { EmployeeService } from '../../../core/services/employee.service';
import { EmployeeModelWithIdAndFileAndImage, EmployeeModelWithIdAndImage } from '../../../shared/models/employed.model';
import { UtilsService } from '../../../shared/services/utils.service';

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
export class ModifyEmployeeComponent implements OnInit, OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly employeeService = inject(EmployeeService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() employeeData: EmployeeModelWithIdAndImage | null = null;

  formGroup: FormGroup;

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      role: ['', Validators.required],
      phone: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, Validators.email]],
      image: [null]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['employeeData'] && this.employeeData) {
      this.formGroup.patchValue({
        name: this.employeeData.name,
        role: this.employeeData.role,
        phone: this.employeeData.phone,
        email: this.employeeData.email
      });
    }
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
    if (this.formGroup.invalid || !this.employeeData) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    const updatedEmployee: EmployeeModelWithIdAndFileAndImage = {
      ...this.employeeData,
      ...this.formGroup.value
    }
  
    this.employeeService.updateEmployee(updatedEmployee)
    .then(() => {
      this.utilsService.presentToast({
        message: 'Empleado actualizado correctamente',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      })
      this.toggleOpen();
    })
    .catch((error) => {
      this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'bottom',
          icon: 'alert-circle-outline'
        });
    })
    .finally(() => loading.dismiss());
  }

   get imagePreview(): string | null {
    const file = this.formGroup.get('image')?.value as File | null;
    return file ? URL.createObjectURL(file) : this.employeeData.imageURL;
  }
}
