import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonImg, IonItem, IonList, IonText, IonInput } from '@ionic/angular/standalone';
import { matchPasswordsValidator } from '../../utils/match-password-validator';
import { AuthService } from '../../services/auth.service';
import { UtilsService } from 'src/app/modules/core/services/utils.service';
import { FirebaseService } from 'src/app/modules/core/services/firebase.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg, IonList, IonItem, IonText, IonButton, IonInput, CommonModule, ReactiveFormsModule]
})
export class RegisterPage implements OnInit {
  form!: FormGroup

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly utilsService: UtilsService,
    private readonly firebaseService: FirebaseService,
  ) { }

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
    if (this.form.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();

      this.authService.singUp(this.form.value['email'], this.form.value['password'])
        .then(async response => {
          await this.setUserInfo(response.user.uid)
          console.log(response.user.getIdToken());
          // this.utilsService.saveInLocalStorage('token', )
        })
        .catch((error) => this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'green',
          position: 'middle',
          icon: 'alert-circle-outline'
        }))
        .finally(() => loading.dismiss());

      console.log('Registro: ', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

  async setUserInfo(uid: string) {
    const path = `users/${uid}`;
    delete this.form.value.password;
    delete this.form.value.confirmPassword;

    this.firebaseService.setDocument(path, this.form.value)
      .then(async res => {
        { await this.authService.updateUser(this.form.value.name) };
      })
      .catch((error) => this.utilsService.presentToast({
        message: error.message,
        duration: 2500,
        color: 'green',
        position: 'middle',
        icon: 'alert-circle-outline'
      }))
  }
}
