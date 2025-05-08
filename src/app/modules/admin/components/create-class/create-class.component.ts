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
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonAvatar
} from '@ionic/angular/standalone';

import { ClassService } from '../../../core/services/class.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { ClassModel } from '../../../shared/models/class.model';

import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Component({
  selector: 'app-create-class',
  standalone: true,
  imports: [
    IonAvatar, IonLabel,
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
    IonSelectOption
  ],
  templateUrl: './create-class.component.html',
  styleUrls: ['./create-class.component.scss']
})
export class CreateClassComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly classService = inject(ClassService);
  private readonly utilsService = inject(UtilsService);
  private readonly storage = inject(Storage);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  formGroup: FormGroup;
  selectedFile: File | null = null;

  instructors = [
    { uid: 'inst-001', displayName: 'Carlos Pérez' },
    { uid: 'inst-002', displayName: 'Laura Gómez' },
    { uid: 'inst-003', displayName: 'Andrés Ruiz' }
  ];

  ngOnInit(): void {
    this.setupForm();
    this.listenToTimeChanges();
  }

  setupForm(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      instructor: ['', Validators.required],
      capacity: [1, [Validators.required, Validators.min(1)]],
      duration: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      imageURL: [''] // Añadido para mantener compatibilidad con validación visual
    });
  }

  listenToTimeChanges(): void {
    this.formGroup.get('startTime')?.valueChanges.subscribe(() => this.calculateDuration());
    this.formGroup.get('endTime')?.valueChanges.subscribe(() => this.calculateDuration());
  }

  calculateDuration(): void {
    const start = this.formGroup.get('startTime')?.value;
    const end = this.formGroup.get('endTime')?.value;

    if (start && end) {
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      const startMinutes = h1 * 60 + m1;
      const endMinutes = h2 * 60 + m2;

      if (endMinutes > startMinutes) {
        const diff = endMinutes - startMinutes;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        const result = `${hours > 0 ? hours + 'h ' : ''}${minutes}min`;
        this.formGroup.get('duration')?.setValue(result);
      } else {
        this.formGroup.get('duration')?.setValue('');
      }
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
    loading.message = 'Guardando clase...';
    await loading.present();

    try {
      const path = `class-images/${Date.now()}-${this.selectedFile.name}`;
      const storageRef = ref(this.storage, path);
      await uploadBytes(storageRef, this.selectedFile);
      const imageURL = await getDownloadURL(storageRef);

      const classData: ClassModel = {
        ...this.formGroup.value,
        imageURL,
        createdAt: new Date()
      };

      await this.classService.createClass(classData);

      await this.utilsService.presentToast({
        message: 'Clase creada correctamente',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      this.formGroup.reset();
      this.selectedFile = null;
      this.setupForm();
      this.toggleOpen();

    } catch (error: any) {
      await this.utilsService.presentToast({
        message: error.message || 'Error al crear clase',
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
