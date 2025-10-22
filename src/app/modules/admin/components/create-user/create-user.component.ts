import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
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
  IonSelect,
  IonSelectOption,
  IonText,
  IonTitle,
  IonToolbar,
  IonLabel,
  IonAvatar
} from '@ionic/angular/standalone';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { NgIf } from '@angular/common';
import { StateEnum } from '../../../shared/enums/state.enum';
import { RoleEnum } from '../../../shared/enums/role.enum';
import { StorageService } from '../../../shared/services/storage.service';
import { STORAGE } from '../../../shared/constants/firebase.constant';
import { UserModel } from '../../../shared/models/user.model';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss'],
  standalone: true,
  imports: [
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonButtons,
    IonIcon,
    IonContent,
    IonInput,
    IonItem,
    IonList,
    IonSelect,
    IonSelectOption,
    IonText,
    IonLabel,
    IonAvatar,
    NgIf,
    ReactiveFormsModule
  ]
})
export class CreateUserComponent implements OnInit {
  @Input() isOpen = false;
  @Output() isOpenChange = new EventEmitter<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly utilsService = inject(UtilsService);
  private readonly storageService = inject(StorageService);

  protected form!: FormGroup;
  protected possibleRoles = RoleEnum;
  protected possibleStates = StateEnum;

  ngOnInit() {
    this.setupForm();
  }

  setupForm() {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]], // 🆕
      phoneNumber: ['', [Validators.required]],
      birthdate: ['', [Validators.required]],
      role: ['', [Validators.required]],
      state: ['', [Validators.required]],
      image: [null, Validators.required]
    });
  }

  toggleOpen() {
    this.isOpenChange.emit();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.form.patchValue({ image: file });
    }
  }

  get imagePreview(): string | null {
    const file = this.form.get('image')?.value as File | null;
    return file ? URL.createObjectURL(file) : null;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      const formValue = this.form.value;
      const file: File = formValue.image;

      const photoURL = await this.storageService.uploadFile(
        file,
        `${STORAGE.IMAGES}/users/${file.name}`
      );

      const uid = crypto.randomUUID();
      const now = new Date().toISOString();

      const userData: UserModel = {
        uid,
        email: formValue.email,
        displayName: formValue.name,
        phoneNumber: formValue.phoneNumber,
        birthdate: formValue.birthdate,
        role: formValue.role,
        state: formValue.state,
        photoURL,
        createdAt: now,
        createdBy: 'system',
        updatedAt: now,
        updatedBy: 'system'
      };

      await this.userService.createUser(userData);

      this.utilsService.presentToast({
        message: 'Usuario creado correctamente',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      this.form.reset();
      this.toggleOpen();
    } catch (error: any) {
      this.utilsService.presentToast({
        message: error.message || 'Error al crear usuario',
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
