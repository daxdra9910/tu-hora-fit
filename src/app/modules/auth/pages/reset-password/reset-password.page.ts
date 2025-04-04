import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
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
  IonInput,
  NavController
} from '@ionic/angular/standalone';
import { matchPasswordsValidator } from '../../utils/match-password-validator';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

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
  private readonly formBuilder = inject(FormBuilder);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly navCtrl = inject(NavController);
  
  form!: FormGroup;
  oobCode = "";

  ngOnInit(): void {
    this.setupForm();
    this.activatedRoute.queryParams.subscribe(params => {
      this.oobCode = params['oobCode'];
    })
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
      this.authService.resetPassword(this.oobCode, this.form.value.password)
      .then(() => this.navCtrl.navigateBack('/auth/login'))
    } else {
      this.form.markAllAsTouched();
    }
  }
}
