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
  IonTitle,
  IonToolbar,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';

import { ClassModel } from '../../../shared/models/class.model';
import { ClassService } from '../../../core/services/class.service';
import { UtilsService } from '../../../shared/services/utils.service';

@Component({
  selector: 'app-modify-class',
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
    IonSelect,
    IonSelectOption,
  ],
  templateUrl: './modify-class.component.html',
  styleUrls: ['./modify-class.component.scss']
})


export class ModifyClassComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly classService = inject(ClassService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() classData: ClassModel | null = null;

  formGroup: FormGroup;

  instructors = [
    { uid: 'inst-001', displayName: 'Carlos Pérez' },
    { uid: 'inst-002', displayName: 'Laura Gómez' },
    { uid: 'inst-003', displayName: 'Andrés Ruiz' }
  ];

  constructor() {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      instructor: ['', Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      duration: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      imageURL: ['', Validators.required]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['classData'] && this.classData) {
      this.formGroup.patchValue({
        name: this.classData.name,
        instructor: this.classData.instructor,
        capacity: this.classData.capacity,
        duration: this.classData.duration,
        startTime: this.classData.startTime,
        endTime: this.classData.endTime,
        imageURL: this.classData.imageURL
      });
    }
  }

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  async onSubmit(): Promise<void> {
    if (this.formGroup.invalid || !this.classData) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const updatedClass: ClassModel = {
      ...this.classData,
      ...this.formGroup.value
    };

    const loading = await this.utilsService.loading();
    await loading.present();

    this.classService.updateClass(updatedClass)
      .then(async () => {
        await this.utilsService.presentToast({
          message: 'Clase actualizada correctamente',
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
          position: 'bottom',
          color: 'danger',
          icon: 'alert-circle-outline'
        });
      })
      .finally(() => loading.dismiss());
  }
}
