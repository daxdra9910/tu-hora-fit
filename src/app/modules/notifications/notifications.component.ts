import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonLabel, IonTextarea, IonButton, IonItem
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonInput,
    IonLabel,
    IonTextarea,
    IonButton,
    IonItem
  ],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      body: ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const { title, body } = this.form.value;
    console.log('📨 Enviar notificación:', { title, body });

    // Aquí iría la lógica real con el servicio
  }
}
