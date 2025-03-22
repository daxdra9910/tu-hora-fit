import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
  IonInput
} from '@ionic/angular/standalone';
import { matchPasswordsValidator } from '../../utils/match-password-validator';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
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
export class ResetPasswordPage implements OnInit {
  form!: FormGroup;

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.setupForm();
  }

  setupForm(): void {
    this.form = this.formBuilder.group(
      {
        password: ['', [Validators.required]],
        confirmPassword: ['', [Validators.required]]
      },
      {
        validators: matchPasswordsValidator('password', 'confirmPassword')
      }
    );
  }

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Nueva contraseña: ', this.form.value.password);
      // Aquí iría la lógica para enviar la nueva contraseña
    } else {
      this.form.markAllAsTouched();
    }
  }
}
