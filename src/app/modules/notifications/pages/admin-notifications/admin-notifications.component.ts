// src/app/home/notifications/pages/admin-notifications/admin-notifications.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonInput, IonLabel, IonTextarea, IonButton, IonItem
} from '@ionic/angular/standalone';
import { NotificationsService } from '../../../core/services/notifications.service';
import { Auth } from '@angular/fire/auth'; // para obtener uid del admin actual
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonInput, IonLabel, IonTextarea, IonButton, IonItem
  ],
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.scss']
})
export class NotificationsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationsService);
  private readonly auth = inject(Auth);
  private readonly toastCtrl = inject(ToastController);

  form!: FormGroup;
  sending = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(100)]],
      body:  ['', [Validators.required, Validators.maxLength(500)]],
    });
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'primary' = 'success', duration = 2000) {
    const t = await this.toastCtrl.create({
      message,
      duration,
      color,
      position: 'bottom',
    });
    await t.present();
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid || this.sending) return;
    this.sending = true;
    try {
      const { title, body } = this.form.value;
      const uid = this.auth.currentUser?.uid ?? 'admin';
      await this.notifications.createBroadcast({ title, body, createdBy: uid });

      // reset del formulario y mostrar toast de éxito
      this.form.reset();
      await this.showToast('Notificación enviada', 'success', 1800);
    } catch (err) {
      console.error('Error enviando notificación', err);
      await this.showToast('Error al enviar la notificación', 'danger', 2500);
    } finally {
      this.sending = false;
    }
  }
}
