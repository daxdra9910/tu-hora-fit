import { Component, OnInit, ViewChildren, QueryList, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent, IonHeader, IonToolbar, IonTitle, IonList, IonItem,
  IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonImg, IonSpinner,
  IonSkeletonText, IonCol, IonGrid, IonRow
} from '@ionic/angular/standalone';
import { DateTime } from 'luxon';

import { UtilsService } from '../../../shared/services/utils.service';
import { ClassService } from '../../../core/services/class.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { ReservationService, ReservationModel } from '../../../core/services/reservations.service';
import type { ClassModelWithIdAndImage } from '../../../shared/models/class.model';
import { AuthService } from '../../../auth/services/auth.service';


const TZ = 'America/Bogota';
const LOCALE = 'es';

type Row = {
  reservation: ReservationModel;
  schedule: { id: string; startISO: string; endISO?: string };
  class: ClassModelWithIdAndImage;

  // Etiquetas para la card
  dateLabel: string;     // Fecha (e.g., "lunes 13 de mayo de 2025")
  startHour: string;     // "h:mm a"
  endHour: string;       // "h:mm a"
  instructor?: string;

  // Para reglas de cancelación
  minutesLeft: number;
  canCancel: boolean;
};

@Component({
  selector: 'app-mine',
  standalone: true,
  templateUrl: './mine.page.html',
  styleUrls: ['./mine.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle,
    IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption,
    IonIcon, IonImg, IonSpinner, IonSkeletonText,
    IonGrid, IonRow, IonCol
  ]
})
export class MinePage implements OnInit {
  private readonly utils = inject(UtilsService);
  private readonly classesSrv = inject(ClassService);
  private readonly scheduleSrv = inject(ScheduleService);
  private readonly reservationSrv = inject(ReservationService);
  private readonly authSrv = inject(AuthService);


  @ViewChildren(IonItemSliding) slidings!: QueryList<IonItemSliding>;

  loading = false;
  rows: Row[] = [];
  cancelBusy: Record<string, boolean> = {};

  // TODO: reemplazar por el UID real (igual que en BrowsePage)
  currentUserId: string | null = null;

async ngOnInit() {

  this.authSrv.authState$.subscribe(async user => {
    if (!user) {
      console.warn('[MinePage] Usuario no autenticado');
      return;
    }

    this.currentUserId = user.uid;
    console.log('[MinePage] UID autenticado:', this.currentUserId);

    // 👇 AHORA sí, cargar reservas
    await this.load();
  });

}

  private fmtDate(iso?: string) {
    if (!iso) return '';
    const dt = DateTime.fromISO(iso, { zone: TZ, locale: LOCALE });
    return dt.isValid ? dt.toFormat("cccc d 'de' LLLL 'de' yyyy") : '';
  }

  private fmtHour(iso?: string) {
    if (!iso) return '';
    const dt = DateTime.fromISO(iso, { zone: TZ, locale: LOCALE });
    return dt.isValid ? dt.toFormat('h:mm a') : '';
  }

  private minsLeft(iso?: string) {
    if (!iso) return -9999;
    const now = DateTime.now().setZone(TZ);
    const start = DateTime.fromISO(iso, { zone: TZ });
    return Math.floor(start.diff(now, 'minutes').minutes);
  }

  private canCancel(iso?: string) {
    return this.minsLeft(iso) >= 60;
  }

  // 🔎 Determina si la clase ya pasó (usa end si existe; si no, start)
  private isPast(startISO?: string, endISO?: string): boolean {
    const now = DateTime.now().setZone(TZ);
    const start = startISO ? DateTime.fromISO(startISO, { zone: TZ }) : null;
    const end   = endISO   ? DateTime.fromISO(endISO,   { zone: TZ }) : null;
    if (end?.isValid) return end <= now;
    if (start?.isValid) return start <= now;
    return false;
  }

  async load() {
    this.loading = true;
    try {
      // 1) Reservas activas del usuario
      const reservations = await this.reservationSrv.listUserActiveReservations(this.currentUserId);
      if (reservations.length === 0) {
        this.rows = [];
        return;
      }

      // 2) Cargar schedules normalizados (incluye instructor) y clases
      const scheduleIds = [...new Set(reservations.map(r => r.scheduleId))];
      const schedules = await this.scheduleSrv.getByIdsNormalized(scheduleIds);

      const classIds = [...new Set(schedules.map((s: any) => s.idClass))];
      const classes = await this.classesSrv.getByIds(classIds);

      const classMap: Record<string, ClassModelWithIdAndImage> = {};
      classes.forEach((c: any) => classMap[c.id] = c);

      const scheduleMap: Record<string, any> = {};
      schedules.forEach((s: any) => scheduleMap[s.id] = s);

      // 3) Armar filas con etiquetas solicitadas y filtrar PASADAS
      const rows: Row[] = [];
      for (const r of reservations) {
        const s = scheduleMap[r.scheduleId];
        if (!s) continue;

        const startISO: string = String(s.start ?? s.date);
        const endISO: string | undefined = s.end ? String(s.end) : undefined;

        // ⛔️ No mostrar reservas pasadas
        if (this.isPast(startISO, endISO)) continue;

        const cls = classMap[s.idClass] ?? {
          id: s.idClass,
          name: 'Clase',
          description: '',
          imageURL: 'assets/placeholder-class.jpg'
        } as ClassModelWithIdAndImage;

        rows.push({
          reservation: r,
          schedule: { id: s.id, startISO, endISO },
          class: cls,

          dateLabel: this.fmtDate(startISO),
          startHour: this.fmtHour(startISO),
          endHour: this.fmtHour(endISO),
          instructor: s.instructor || undefined,

          minutesLeft: this.minsLeft(startISO),
          canCancel: this.canCancel(startISO),
        });
      }

      // 4) Orden por inicio ascendente
      rows.sort((a, b) =>
        DateTime.fromISO(a.schedule.startISO).toMillis() -
        DateTime.fromISO(b.schedule.startISO).toMillis()
      );

      this.rows = rows;

    } catch (err: any) {
      console.error('[mine] load error', err);
      await this.utils.presentToast({
        message: err?.message ?? 'No se pudieron cargar tus reservas',
        duration: 2500, color: 'danger', position: 'bottom', icon: 'alert-circle-outline',
      });
    } finally {
      this.loading = false;
      this.slidings?.forEach(s => s.closeOpened());
    }
  }

  openSlide(sliding: IonItemSliding) {
    try { sliding.open('end'); } catch {}
  }

  async cancel(row: Row) {
    if (!row.canCancel) {
      return this.utils.presentToast({
        message: 'Solo puedes cancelar hasta 60 minutos antes de la clase.',
        duration: 2200, color: 'warning', position: 'bottom', icon: 'alert-circle-outline',
      });
    }
    const id = row.reservation.id;
    this.cancelBusy[id] = true;
    try {
      await this.reservationSrv.cancel(id, this.currentUserId);
      // Remueve de la lista en memoria
      this.rows = this.rows.filter(r => r.reservation.id !== id);

      await this.utils.presentToast({
        message: 'Reserva cancelada.', duration: 1800, color: 'success',
        position: 'bottom', icon: 'checkmark-circle-outline',
      });
    } catch (err: any) {
      await this.utils.presentToast({
        message: err?.message ?? 'No se pudo cancelar',
        duration: 2500, color: 'danger', position: 'bottom', icon: 'alert-circle-outline',
      });
    } finally {
      this.cancelBusy[id] = false;
      this.slidings?.forEach(s => s.closeOpened());
    }
  }
}
