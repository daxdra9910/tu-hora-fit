import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonImg,
  IonItem,
  IonList,
  IonText,
  IonInput,
  NavController
} from '@ionic/angular/standalone';

import { matchPasswordsValidator } from '../../utils/match-password-validator';
import { AuthService } from '../../services/auth.service';
import { UtilsService } from 'src/app/modules/shared/services/utils.service';
import { UserModel } from '../../../shared/models/user.model';
import { RoleEnum } from '../../../shared/enums/role.enum';
import { StateEnum } from '../../../shared/enums/state.enum';
import { UserService } from '../../../core/services/user.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonImg,
    IonList,
    IonItem,
    IonText,
    IonButton,
    IonInput,
    CommonModule,
    ReactiveFormsModule
  ]
})
export class RegisterPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly utilsService = inject(UtilsService);
  private readonly navCtrl = inject(NavController);
  private readonly userService = inject(UserService);

  form!: FormGroup;

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.form = this.formBuilder.group(
      {
        name: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[a-zA-ZÀ-ÿ\s]{3,}$/)
          ]
        ],
        email: ['', [Validators.required, Validators.email]],
        phone: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[0-9]{10}$/)
          ]
        ],
        birthdate: ['', [Validators.required]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.pattern(/^(?=.*[A-Z])(?=.*\d).+$/)
          ]
        ],
        confirmPassword: ['', [Validators.required]]
      },
      {
        validators: matchPasswordsValidator('password', 'confirmPassword')
      }
    );
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, phone, birthdate, password } = this.form.value;

    const loading = await this.utilsService.loading();
    await loading.present();

    try {
      // 1️⃣ Crear usuario en Firebase Auth
      const cred = await this.authService.singUp(email, password);
      const firebaseUser = cred.user;

      // 2️⃣ Actualizar displayName
      await this.authService.updateUser(name);

      // 3️⃣ Crear usuario en Firestore
      const newUser: UserModel = {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: name,
        phoneNumber: phone,
        photoURL: firebaseUser.photoURL || '',
        birthdate,
        role: RoleEnum.CLIENT,
        state: StateEnum.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: firebaseUser.uid,
        updatedBy: firebaseUser.uid
      };

      await this.userService.createUser(newUser);

      // 4️⃣ Navegar
      this.navCtrl.navigateForward('/home');

    } catch (error: any) {
      const code = error?.code || error?.error?.code;

      // 🔴 Error específico de registro
      if (code === 'auth/email-already-in-use') {
        this.form.get('email')?.setErrors({ emailTaken: true });
        this.form.get('email')?.markAsTouched();
      }

      const message = this.utilsService.getFirebaseAuthErrorMessage(code);

      await this.utilsService.presentToast({
        message,
        duration: 2500,
        color: 'danger',
        position: 'bottom',
        icon: 'alert-circle-outline'
      });
    }
    finally {
      await loading.dismiss();
    }
  }
}
