import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonImg, IonItem, IonList, IonText, IonInput, NavController } from '@ionic/angular/standalone';
import { matchPasswordsValidator } from '../../utils/match-password-validator';
import { AuthService } from '../../services/auth.service';
import { UtilsService } from 'src/app/modules/shared/services/utils.service';
import {UserModel} from "../../../shared/models/user.model";
import {RoleEnum} from "../../../shared/enums/role.enum";
import {StateEnum} from "../../../shared/enums/state.enum";
import {UserService} from "../../../core/services/user.service";

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg, IonList, IonItem, IonText, IonButton, IonInput, CommonModule, ReactiveFormsModule]
})
export class RegisterPage implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly utilsService = inject(UtilsService);
  private readonly navCtrl = inject(NavController);
  private readonly userService = inject(UserService);

  form!: FormGroup

  ngOnInit() {
    this.setupForm();
  }

  setupForm(): void {
    this.form = this.formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required]],
      birthdate: ['', [Validators.required]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: matchPasswordsValidator('password', 'confirmPassword')
    })
  }

  async onSubmit() {
    if (this.form.invalid) return;

    const { name, email, phone, birthdate, password } = this.form.value;

    const loading = await this.utilsService.loading()
    await loading.present();

    this.authService.singUp(email, password)
      .then(async cred => {
        const firebaseUser = cred.user;
        await this.authService.updateUser(name);
        return firebaseUser;
      })
      .then((firebaseUser) => {
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

        return this.userService.createUser(newUser);
      })
      .then(() => {
        this.navCtrl.navigateForward(['/home']);
      })
      .catch(error => this.utilsService.presentToast({
        message: error.message,
        duration: 2500,
        color: 'danger',
        position: 'bottom',
        icon: 'alert-circle-outline'
      }))
      .finally(async() => await loading.dismiss())
    ;
  }
}
