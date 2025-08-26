import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonChip,
  IonCol,
  IonContent,
  IonGrid,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonRow,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { DateTime } from 'luxon';

import { UtilsService } from '../../../shared/services/utils.service';
import { ClassService } from '../../../core/services/class.service';
import { ReservationService } from '../../../core/services/reservations.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { ClassModelWithIdAndImage } from '../../../shared/models/class.model';

@Component({
  selector: 'app-browse',
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonText,
    IonList,
    IonItem,
    IonGrid,
    IonRow,
    IonCol,
    IonChip,


  ],
})
export class BrowsePage implements OnInit {
  private readonly utils = inject(UtilsService);
  private readonly classesSrv = inject(ClassService);
  private readonly scheduleSrv = inject(ScheduleService);
  private readonly reservationSrv = inject(ReservationService);

  // Catálogo de clases indexado por id
  classesById: Record<string, ClassModelWithIdAndImage> = {};

  // Día seleccionado (local)
  selected = DateTime.local().startOf('day');

  // Rango de chips (hoy ±2 por defecto)
  chipDays: DateTime[] = [];

  // Listado de horarios para el día
  schedules: any[] = [];

  // Estados UI
  reservingId: string | null = null;
  loadingList = false;

  // TODO: reemplazar con tu UID real del usuario autenticado
  currentUserId = 'system';

  async ngOnInit() {
    await this.bootstrap();
    this.buildChipDays();
    await this.loadDay(this.selected);
  }

  /** Carga catálogo de clases una sola vez */
  private async bootstrap() {
    const loading = await this.utils.loading();
    await loading.present();
    try {
      const classes = await this.classesSrv.getAllClasses();
      const map: Record<string, ClassModelWithIdAndImage> = {};
      classes.forEach((c) => (map[c.id] = c));
      this.classesById = map;
    } catch (error: any) {
      await this.utils.presentToast({
        message: error.message || 'No se pudieron cargar las clases',
        duration: 2500,
        color: 'danger',
        position: 'bottom',
        icon: 'alert-circle-outline',
      });
    } finally {
      loading.dismiss();
    }
  }

  /** Construye los 5 chips alrededor del seleccionado */
  buildChipDays(center = this.selected) {
    this.chipDays = [-2, -1, 0, 1, 2].map((v) => center.plus({ days: v }));
  }

  /** Cambia el día seleccionado y recarga */
  async pickDay(d: DateTime) {
    this.selected = d.startOf('day');
    this.buildChipDays(this.selected);
    await this.loadDay(this.selected);
  }

  /** Navegación con flechas en la barra de chips */
  async moveDays(delta: number) {
    this.selected = this.selected.plus({ days: delta }).startOf('day');
    this.buildChipDays(this.selected);
    await this.loadDay(this.selected);
  }

  /** Carga horarios del día (usa ScheduleService.getSchedulesByDay) */
  private async loadDay(d: DateTime) {
    const dayISO = d.toISODate()!; // YYYY-MM-DD
    this.loadingList = true;
    try {
      this.schedules = await this.scheduleSrv.getSchedulesByDay(dayISO);
    } catch (error: any) {
      await this.utils.presentToast({
        message: error.message || 'Error al cargar horarios',
        duration: 2500,
        color: 'danger',
        position: 'bottom',
        icon: 'alert-circle-outline',
      });
      this.schedules = [];
    } finally {
      this.loadingList = false;
    }
  }

  /** Formatea horas */
  fmtHour(iso: string) {
    return DateTime.fromISO(iso).toFormat('h:mm a');
  }

  /** Cupos */
  libres(s: any) {
    return Math.max(0, Number(s.capacity ?? 0) - Number(s.booked ?? 0));
  }

  lleno(s: any) {
    return this.libres(s) === 0;
  }

  /** Reservar */
  async reservar(s: any) {
    const loading = await this.utils.loading();
    await loading.present();
    try {
      this.reservingId = s.id;
      await this.reservationSrv.reserve(s.id, this.currentUserId);

      // Feedback optimista: aumenta booked en memoria
      this.schedules = this.schedules.map((x) =>
        x.id === s.id ? { ...x, booked: Number(x.booked ?? 0) + 1 } : x
      );

      await this.utils.presentToast({
        message: '¡Reserva confirmada!',
        duration: 2000,
        color: 'success',
        position: 'bottom',
        icon: 'checkmark-circle-outline',
      });
    } catch (error: any) {
      await this.utils.presentToast({
        message: error.message || 'No se pudo reservar',
        duration: 2500,
        color: 'danger',
        position: 'bottom',
        icon: 'alert-circle-outline',
      });
    } finally {
      this.reservingId = null;
      loading.dismiss();
    }
  }
}
