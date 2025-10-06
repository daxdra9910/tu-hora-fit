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

import { ClassService } from '../../../core/services/class.service';
import { ClassModelWithFile } from '../../../shared/models/class.model';
import { UtilsService } from '../../../shared/services/utils.service';


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
    IonInput
  ],
  templateUrl: './create-class.component.html',
  styleUrls: ['./create-class.component.scss']
})
export class CreateClassComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly classService = inject(ClassService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  formGroup: FormGroup;

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
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

    const classData: ClassModelWithFile = {
      ...this.formGroup.value
    };

    this.classService.createClass(classData)
      .then(() => {
        this.utilsService.presentToast({
          message: 'Clase creada correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
        this.toggleOpen();
      })
      .catch((error) => {
        this.utilsService.presentToast({
          message: error.message || 'Error al crear clase',
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
