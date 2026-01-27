import { Component, OnInit, inject } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonIcon,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonBadge
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { addIcons } from 'ionicons';
import { calendarOutline, timeOutline } from 'ionicons/icons';

import { ReservationService } from '../../../core/services/reservations.service';
import { AuthService } from '../../../auth/services/auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-reservations-history',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonIcon,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonBadge
  ],
  templateUrl: './reservations-history.page.html',
  styleUrls: ['./reservations-history.page.scss']
})
export class ReservationsHistoryPage implements OnInit {

  private reservationService = inject(ReservationService);
  private authService = inject(AuthService);

  reservations: any[] = [];
  loading = true;

  constructor() {
    addIcons({
      calendarOutline,
      timeOutline
    });
  }

  async ngOnInit() {
    await this.loadReservations();
  }

  async loadReservations() {
    try {
      this.loading = true;

      const user = await firstValueFrom(this.authService.authState$);
      if (!user) return;

      this.reservations =
        await this.reservationService.listUserActiveReservationsDetailed(user.uid);

    } catch (error) {
      console.error('❌ Error cargando historial de reservas:', error);
      this.reservations = [];
    } finally {
      this.loading = false;
    }
  }

  getReservationStatus(r: any): { text: string; color: string } {
    if (r.reservation.cancelledAt) {
      return { text: 'Cancelada', color: 'danger' };
    }

    if (!r.reservation.active) {
      return { text: 'Finalizada', color: 'medium' };
    }

    return { text: 'Activa', color: 'success' };
  }

}
