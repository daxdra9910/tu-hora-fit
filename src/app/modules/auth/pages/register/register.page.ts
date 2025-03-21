import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonImg, IonItem, IonList, IonText, IonInput } from '@ionic/angular/standalone';
import { matchPasswordsValidator } from '../../utils/match-password-validator';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonImg, IonList, IonItem, IonText, IonButton, IonInput, CommonModule, ReactiveFormsModule]
})
export class RegisterPage implements OnInit {
  form!: FormGroup

  constructor(private readonly formBuilder: FormBuilder) { }

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

  onSubmit(): void {
    if (this.form.valid) {
      console.log('Registro: ', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
