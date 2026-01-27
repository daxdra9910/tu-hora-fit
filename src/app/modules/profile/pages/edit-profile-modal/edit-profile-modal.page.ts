import { Component, OnInit, inject, Input, OnDestroy } from '@angular/core';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonItem,
  IonInput,
  IonLabel,
  IonDatetime,
  IonDatetimeButton,
  IonModal,
  IonAvatar,
  IonImg,
  IonSpinner,
  IonText,
  IonCard,
  IonCardContent
} from '@ionic/angular/standalone';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import {
  close,
  camera,
  save,
  personCircleOutline,
  calendarOutline,
  callOutline,
  mailOutline,
  personOutline
} from 'ionicons/icons';

import { UserModel } from '../../../shared/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { AuthService } from '../../../auth/services/auth.service';
import { firstValueFrom } from 'rxjs';
import { ProfileImageService } from '../../../shared/services/profile-image.service';




@Component({
  selector: 'app-edit-profile-modal',
  templateUrl: './edit-profile-modal.page.html',
  styleUrls: ['./edit-profile-modal.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonButtons,
    IonButton, IonIcon, IonContent, IonItem,
    IonInput, IonLabel, IonDatetime, IonDatetimeButton,
    IonModal, IonAvatar, IonSpinner,
    IonText, IonCard, IonCardContent
  ]
})
export class EditProfileModalPage implements OnInit, OnDestroy {
  private modalCtrl = inject(ModalController);
  private formBuilder = inject(FormBuilder);
  private userService = inject(UserService);
  private utilsService = inject(UtilsService);
  private authService = inject(AuthService);
  private profileImageService = inject(ProfileImageService);



  @Input() user!: UserModel;

  form!: FormGroup;
  selectedFile: File | null = null;
  imagePreviewUrl: string | null = null;

  loading = false;
  uploadingImage = false;

  selectedDate?: string;
  maxDate: string;

  constructor() {
    addIcons({
      close,
      camera,
      save,
      personCircleOutline,
      calendarOutline,
      callOutline,
      mailOutline,
      personOutline
    });

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    this.maxDate = `${yyyy}-${mm}-${dd}T23:59:59`;
  }

  ngOnInit() {
    this.setupForm();
    this.populateForm();
  }

  ngOnDestroy() {
    this.cleanupBlobUrl();
  }

  private setupForm() {
    this.form = this.formBuilder.group({
      displayName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{8,20}$/)]],
      birthdate: ['', Validators.required]
    });
  }

  private populateForm() {
    if (!this.user) return;

    this.form.patchValue({
      displayName: this.user.displayName || '',
      phoneNumber: this.user.phoneNumber || '',
      birthdate: this.user.birthdate || ''
    });

    if (this.user.birthdate) {
      this.selectedDate = `${this.user.birthdate}T12:00:00`;
    } else {
      this.selectedDate = undefined;
    }

    this.imagePreviewUrl = null;

  }

  onDateChange(event: any) {
    const value = event.detail.value;
    if (!value) return;

    const dateOnly = value.split('T')[0];
    this.form.patchValue({
      birthdate: dateOnly
    });
    this.selectedDate = `${dateOnly}T12:00:00`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Solo se permiten imágenes', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showToast('La imagen no debe superar 5MB', 'warning');
      return;
    }

    this.cleanupBlobUrl();
    this.selectedFile = file;
    this.imagePreviewUrl = URL.createObjectURL(file);
  }

  private cleanupBlobUrl() {
    if (this.imagePreviewUrl && this.imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreviewUrl);
    }
  }

  private showToast(message: string, color: 'success' | 'warning' | 'danger' = 'success') {
    this.utilsService.presentToast({
      message,
      duration: 3000,
      color
    });
  }

  triggerFileInput() {
    const fileInput = document.getElementById('profileImageInput') as HTMLInputElement;
    fileInput?.click();
  }

  hasChanges(): boolean {
    if (!this.user) return false;

    const formChanged =
      this.form.value.displayName !== (this.user.displayName || '') ||
      this.form.value.phoneNumber !== (this.user.phoneNumber || '') ||
      this.form.value.birthdate !== (this.user.birthdate || '');

    const imageChanged = this.selectedFile != null;

    return formChanged || imageChanged;
  }
  async onSubmit() {
    if (this.form.invalid || !this.user || !this.hasChanges()) {
      this.form.markAllAsTouched();
      if (!this.hasChanges()) {
        this.showToast('No hay cambios para guardar', 'warning');
      }
      return;
    }

    this.loading = true;
    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      let photoURL = this.user.photoURL;

      // =====================
      // SUBIR NUEVA IMAGEN
      // =====================
      if (this.selectedFile) {
        this.uploadingImage = true;

        try {
          // 1. Generar nombre único
          const fileExtension = this.selectedFile.name.split('.').pop();
          const timestamp = Date.now();
          const randomString = Math.random().toString(36).substring(2, 15);
          const fileName = `profile_${timestamp}_${randomString}.${fileExtension}`;

          // 🔐 Obtener usuario autenticado REAL (Firebase Auth)
          const authUser = await firstValueFrom(this.authService.authState$);

          console.log('AUTH UID:', authUser?.uid);
          console.log('MODEL UID:', this.user.uid);
          console.log('IS FILE:', this.selectedFile instanceof File);

          if (!authUser) {
            throw new Error('Usuario no autenticado (Firebase Auth)');
          }

          photoURL = await this.profileImageService.uploadProfileImage(this.selectedFile);

          console.log('✅ Nueva imagen subida (URL):', photoURL);




          console.log('✅ Nueva imagen subida:', photoURL);



        } catch (uploadError: any) {
          console.error('❌ Error subiendo imagen:', uploadError);
          throw new Error(`Error al subir imagen: ${uploadError.message}`);
        } finally {
          this.uploadingImage = false;
        }
      }

      // =====================
      // ACTUALIZAR USUARIO
      // =====================
      const phoneNumber = String(this.form.value.phoneNumber ?? '').trim();

      const updatedUser: UserModel = {
        ...this.user,
        displayName: String(this.form.value.displayName ?? '').trim(),
        phoneNumber,
        birthdate: this.form.value.birthdate,
        photoURL,
        updatedAt: new Date().toISOString(),
        updatedBy: this.user.uid
      };

      // Actualizar en Firestore
      await this.userService.updateUser(updatedUser);

      // Limpiar blob URL
      this.cleanupBlobUrl();

      // Mostrar éxito y cerrar
      this.showToast('✅ Perfil actualizado correctamente', 'success');
      this.modalCtrl.dismiss({
        updated: true,
        user: updatedUser
      });

    } catch (error: any) {
      console.error('❌ Error actualizando perfil:', error);

      let errorMessage = 'Error al actualizar el perfil';

      if (error.message?.includes('storage/unauthorized')) {
        errorMessage = 'No tienes permisos para subir imágenes';
      } else if (error.message?.includes('storage/retry-limit-exceeded')) {
        errorMessage = 'Error de conexión. Intenta de nuevo';
      } else if (error.message?.includes('storage/object-not-found')) {
        errorMessage = 'La imagen anterior no existe';
      } else if (error.message?.includes('storage/cannot-slice-blob')) {
        errorMessage = 'La imagen está corrupta o es muy grande';
      } else if (error.message?.includes('storage/quota-exceeded')) {
        errorMessage = 'Se ha excedido el límite de almacenamiento';
      } else if (error.message?.includes('storage/canceled')) {
        errorMessage = 'La subida fue cancelada';
      }

      this.showToast(errorMessage, 'danger');

    } finally {
      this.loading = false;
      loading.dismiss();
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'No especificada';

    const [year, month, day] = dateString.split('-');
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  async closeModal() {
    if (this.hasChanges()) {
      const confirmed = confirm('¿Estás seguro de que quieres descartar los cambios?');
      if (confirmed) {
        this.modalCtrl.dismiss({ updated: false });
      }
    } else {
      this.modalCtrl.dismiss({ updated: false });
    }
  }
}
