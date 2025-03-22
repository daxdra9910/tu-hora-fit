import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonInput, IonButton, IonImg, NavController } from '@ionic/angular/standalone';

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
    IonImg // 📌 IMPORTANTE: Se agrega IonImg para evitar el error NG8001
  ]
})
export class ForgotPasswordPage implements OnInit {
  form: FormGroup;

  constructor(private fb: FormBuilder, private navCtrl: NavController) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]] // 📌 Se define la variable 'email' dentro del formulario
    });
  }

  ngOnInit() {}

  enviarRecuperacion() {
    if (this.form.valid) {
      const email = this.form.value.email;
      console.log("Enviando enlace de recuperación a:", email);
      // Aquí puedes integrar el servicio para enviar el correo de recuperación
    } else {
      console.log("Formulario inválido");
    }
  }

  volverLogin() {
    this.navCtrl.navigateBack('/login');
  }
}
