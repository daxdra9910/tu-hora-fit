import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonContent, IonList, IonItem, IonText, IonButton, IonInput } from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonInput, IonContent, IonList, IonItem, IonText, IonButton, CommonModule, ReactiveFormsModule]
})
export class LoginPage  {

  form: FormGroup;

  constructor(private readonly formBuilder: FormBuilder) {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    })
  }

  onSubmit(): void {
    if(this.form.valid) {
      // TODO: Logica para hacer login.
      console.log('Login: ', this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }

}
