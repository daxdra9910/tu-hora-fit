import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClassModel } from '../../../shared/models/class.model';
import { ClassService } from '../../../core/services/class.service';
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
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonAvatar
} from '@ionic/angular/standalone';
import { Storage } from '@angular/fire/storage';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from '@angular/fire/storage';

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
    IonLabel,
    IonAvatar
  ],
  templateUrl: './modify-class.component.html',
  styleUrls: ['./modify-class.component.scss']
})
export class ModifyClassComponent implements OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly classService = inject(ClassService);
  private readonly utilsService = inject(UtilsService);
  private readonly storage = inject(Storage);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() classData: ClassModel | null = null;

  formGroup: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;

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
    if (this.formGroup.invalid || !this.classData) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      let imageURL = this.classData.imageURL;

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

        const path = `class-images/${Date.now()}-${this.selectedFile.name}`;
        const newRef = storageRef(this.storage, path);
        await uploadBytes(newRef, this.selectedFile);
        imageURL = await getDownloadURL(newRef);
      }

      const updatedClass: ClassModel = {
        ...this.classData,
        ...this.formGroup.value,
        imageURL
      };

      await this.classService.updateClass(updatedClass);

      await this.utilsService.presentToast({
        message: 'Clase actualizada correctamente',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      this.toggleOpen();
    } catch (error: any) {
      await this.utilsService.presentToast({
        message: error.message || 'Error al actualizar clase',
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
