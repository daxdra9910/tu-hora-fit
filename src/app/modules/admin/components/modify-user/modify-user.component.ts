import {
  Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, inject
} from '@angular/core';
import {
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
  IonText,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonAvatar
} from '@ionic/angular/standalone';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { RoleEnum } from '../../../shared/enums/role.enum';
import { StateEnum } from '../../../shared/enums/state.enum';
import { UserModel } from '../../../shared/models/user.model';
import { UserService } from '../../../core/services/user.service';
import { UtilsService } from '../../../shared/services/utils.service';
import { StorageService } from '../../../shared/services/storage.service';
import { STORAGE } from '../../../shared/constants/firebase.constant';

@Component({
  selector: 'app-modify-user',
  standalone: true,
  templateUrl: './modify-user.component.html',
  styleUrls: ['./modify-user.component.scss'],
  imports: [
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
    IonText,
    IonSelect,
    IonSelectOption,
    IonLabel,
    IonAvatar,
    ReactiveFormsModule,
    FormsModule,
    NgIf
  ]
})
export class ModifyUserComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() user: UserModel | null = null;
  @Output() isOpenChange = new EventEmitter<void>();

  private readonly formBuilder = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly utilsService = inject(UtilsService);
  private readonly storageService = inject(StorageService);

  form!: FormGroup;
  selectedFile: File | null = null;

  possibleRoles = RoleEnum;
  possibleStates = StateEnum;

  ngOnInit(): void {
    this.setupForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user && this.form) {
      this.form.patchValue({
        name: this.user.displayName || '',
        email: this.user.email || '',
        phone: this.user.phoneNumber || '',
        birthdate: this.user.birthdate || '',
        role: this.user.role || '',
        state: this.user.state || ''
      });
    }
  }

  setupForm(): void {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      birthdate: ['', Validators.required],
      role: ['', Validators.required],
      state: ['', Validators.required],
      image: [null]
    });
  }

  toggleOpen(): void {
    this.isOpenChange.emit();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      this.form.patchValue({ image: file });
    }
  }

  get imagePreview(): string | null {
    if (this.selectedFile) {
      return URL.createObjectURL(this.selectedFile);
    }
    return this.user?.photoURL || null;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || !this.user) {
      this.form.markAllAsTouched();
      return;
    }

    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      let photoURL = this.user.photoURL;

      if (this.selectedFile) {
        if (photoURL) {
          await this.storageService.deleteFile(photoURL);
        }
        photoURL = await this.storageService.uploadFile(
          this.selectedFile,
          `${STORAGE.IMAGES}/users/${this.selectedFile.name}`
        );
      }

      const updatedUser: UserModel = {
        ...this.user,
        displayName: this.form.value.name,
        email: this.form.value.email,
        phoneNumber: this.form.value.phone,
        birthdate: this.form.value.birthdate,
        role: this.form.value.role,
        state: this.form.value.state,
        photoURL,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system'
      };

      await this.userService.updateUser(updatedUser);

      await this.utilsService.presentToast({
        message: 'Usuario actualizado correctamente',
        duration: 2500,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle'
      });

      this.toggleOpen();
    } catch (error: any) {
      await this.utilsService.presentToast({
        message: error.message || 'Error al actualizar usuario',
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
