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
import { ClassModelWithIdAndFileAndImage, ClassModelWithIdAndImage } from '../../../shared/models/class.model';
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
    IonLabel,
    IonAvatar
  ],
  templateUrl: './modify-class.component.html',
  styleUrls: ['./modify-class.component.scss']
})
export class ModifyClassComponent implements OnInit, OnChanges {
  private readonly formBuilder = inject(FormBuilder);
  private readonly classService = inject(ClassService);
  private readonly utilsService = inject(UtilsService);

  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  @Input() classData: ClassModelWithIdAndImage | null = null;

  formGroup: FormGroup;

  ngOnInit(): void {
    this.formGroup = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      image: [null]
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['classData'] && this.classData) {
      this.formGroup.patchValue({
        name: this.classData.name,
        description: this.classData.description
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
    if (this.formGroup.invalid || !this.classData) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    const updatedClass: ClassModelWithIdAndFileAndImage = {
      ...this.classData,
      ...this.formGroup.value,
    };

    this.classService.updateClass(updatedClass)
      .then(() => {
        this.utilsService.presentToast({
          message: 'Clase actualizada correctamente',
          duration: 2500,
          position: 'bottom',
          color: 'success',
          icon: 'checkmark-circle'
        });
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
    return file ? URL.createObjectURL(file) : this.classData.imageURL;
  }
}
