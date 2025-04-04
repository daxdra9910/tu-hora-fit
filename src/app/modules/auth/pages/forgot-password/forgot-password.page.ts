import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonInput, IonButton, IonImg, NavController } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { UtilsService } from 'src/app/modules/core/services/utils.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonImg
  ]
})
export class ForgotPasswordPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly navCtrl = inject(NavController);
  private readonly authService = inject(AuthService);
  private readonly utilsService = inject(UtilsService);
  
  form: FormGroup;

  ngOnInit() {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  async enviarRecuperacion() {
    if (this.form.valid) {
      const loading = await this.utilsService.loading();
      await loading.present();
      this.authService.forgotPassword(this.form.value.email).then(() => {
        this.utilsService.presentToast({
          message: 'Se ha enviado a su correo electrónico el enlace para restablecer la contraseña',
          duration: 2500,
          animated: true,
          color: 'primary',
          position: 'top',
          icon: 'alert-circle-outline'
        }).catch((error) => this.utilsService.presentToast({
          message: error.message,
          duration: 2500,
          color: 'danger',
          position: 'top',
          icon: 'alert-circle-outline'
        })
        ).finally(() => loading.dismiss());
      })
    } else {
      console.log("Formulario inválido");
    }
  }

  volverLogin() {
    this.navCtrl.navigateBack('/login');
  }
}
