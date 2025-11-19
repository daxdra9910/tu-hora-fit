import { Component, OnInit, ViewChildren, QueryList, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonButton, IonButtons, IonChip, IonCol, IonContent, IonGrid,
  IonHeader, IonIcon, IonItem, IonItemOption, IonItemOptions, IonItemSliding,
  IonLabel, IonList, IonRow, IonText, IonTitle, IonToolbar, IonSpinner,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonModal
} from '@ionic/angular/standalone';
import { DateTime } from 'luxon';

import { ClassService } from '../../../core/services/class.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { ReservationService } from '../../../core/services/reservations.service';
import type { ClassModelWithIdAndImage } from '../../../shared/models/class.model';
import type { ScheduleClassModelWithId } from '../../../shared/models/schedule-class.model';

const LOCALE = 'es';
const TZ = 'America/Bogota';

type AnySchedule = ScheduleClassModelWithId & {
  booked?: number;
  dateKey?: string;
  start?: string;
  end?: string;
  start_time?: string;
  end_time?: string;
  max_capacity?: number;
  class_id: string;
};

type ViewRow = {
  schedule: AnySchedule;
  klass: ClassModelWithIdAndImage | null;
  startLocal: string;
  endLocal: string;
  capacity: number;
  booked: number;
  percentBooked: number;
  attendedCount: number;        // placeholder
  percentCapacityUsed: number;  // placeholder
};

@Component({
  selector: 'app-admin-browse',
  standalone: true,
  templateUrl: './admin-browse.page.html',
  styleUrls: ['./admin-browse.page.scss'],
  imports: [
    CommonModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonText, IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption,
    IonGrid, IonRow, IonCol, IonChip, IonSpinner, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonLabel, IonModal
  ],
})
export class AdminBrowsePage implements OnInit {
  private readonly classesSrv = inject(ClassService);
  private readonly scheduleSrv = inject(ScheduleService);
  private readonly reservationSrv = inject(ReservationService);

  @ViewChildren(IonItemSliding) slidings!: QueryList<IonItemSliding>;

  classesById: Record<string, ClassModelWithIdAndImage> = {};
  selected = DateTime.now().setZone(TZ).setLocale(LOCALE).startOf('day');
  chipDays: DateTime[] = [];
  loadingList = false;
  viewList: ViewRow[] = [];

  /** id del schedule expandido */
  expandedId: string | null = null;

  /** cache de métricas por schedule (para el panel expandido y el modal) */
  detailsByScheduleId: Record<string, {
    reservasActivas: number;
    cancelaciones: number;
    listado: Array<{ name: string; email?: string; status: 'Activa' | 'Cancelada' }>;
  }> = {};

  // Modal de clientes
  clientsOpen = false;
  clientsLoading = false;
  clientsData: null | {
    klassName: string;
    dateText: string;
    startText: string;
    endText: string;
    listado: Array<{ name: string; email?: string; status: 'Activa' | 'Cancelada' }>;
  } = null;

  get selectedLabel(): string {
    return this.selected.setLocale(LOCALE).toFormat("cccc d 'de' LLLL 'de' yyyy");
  }

  async ngOnInit() {
    await this.bootstrapClasses();
    this.buildChipDays();
    await this.loadDay(this.selected);
  }

  private async bootstrapClasses() {
    const classes = await this.classesSrv.getAllClasses();
    const map: Record<string, ClassModelWithIdAndImage> = {};
    classes.forEach((c) => (map[c.id] = c));
    this.classesById = map;
  }

  buildChipDays(center = this.selected) {
    this.chipDays = [-2, -1, 0, 1, 2].map(v =>
      center.plus({ days: v }).setZone(TZ).setLocale(LOCALE)
    );
  }

  async pickDay(d: DateTime) {
    this.selected = d.setZone(TZ).setLocale(LOCALE).startOf('day');
    this.buildChipDays(this.selected);
    await this.loadDay(this.selected);
  }

  async moveDays(delta: number) {
    this.selected = this.selected.plus({ days: delta }).setZone(TZ).setLocale(LOCALE).startOf('day');
    this.buildChipDays(this.selected);
    await this.loadDay(this.selected);
  }

  private fmtHmToAmPm(hm: string) {
    const t = hm?.includes('M')
      ? DateTime.fromFormat(hm, 'h:mm a', { zone: TZ, locale: LOCALE })
      : DateTime.fromFormat(hm, 'HH:mm',   { zone: TZ, locale: LOCALE });
    return t.isValid ? t.setLocale(LOCALE).toFormat('h:mm a') : hm;
  }

  private composeISO(dateLike: any, timeStr?: string): string | undefined {
    if (!dateLike || !timeStr) return undefined;
    const base = this.toDT(dateLike);
    if (!base.isValid) return undefined;

    const parsed = timeStr.includes('M')
      ? DateTime.fromFormat(timeStr, 'h:mm a', { zone: TZ, locale: LOCALE })
      : DateTime.fromFormat(timeStr, 'HH:mm',   { zone: TZ, locale: LOCALE });

    if (!parsed.isValid) return undefined;

    return base.set({ hour: parsed.hour, minute: parsed.minute, second: 0, millisecond: 0 }).toISO();
  }

  private toDT(d: any): DateTime {
    if (!d) return DateTime.invalid('empty');
    if (d instanceof Date) return DateTime.fromJSDate(d, { zone: TZ, locale: LOCALE });
    if (typeof d?.toDate === 'function') return DateTime.fromJSDate(d.toDate(), { zone: TZ, locale: LOCALE });
    return DateTime.fromISO(String(d), { zone: TZ, locale: LOCALE });
  }

  private getStartEndLocal(s: AnySchedule) {
    const startISO = s.start ?? this.composeISO(s.date, s.start_time);
    const endISO   = s.end   ?? this.composeISO(s.date, s.end_time);

    const startText = startISO
      ? DateTime.fromISO(startISO, { zone: TZ, locale: LOCALE }).toFormat('h:mm a')
      : this.fmtHmToAmPm(s.start_time || '');

    const endText = endISO
      ? DateTime.fromISO(endISO, { zone: TZ, locale: LOCALE }).toFormat('h:mm a')
      : this.fmtHmToAmPm(s.end_time || '');

    return { startText, endText };
  }

  private async loadDay(d: DateTime) {
    const dayKey = d.setZone(TZ).toFormat('yyyy-LL-dd');
    this.loadingList = true;
    this.viewList = [];

    try {
      const schedules = await this.scheduleSrv.getSchedulesByDay(dayKey);
      const rows: ViewRow[] = [];

      for (const s of (schedules ?? []) as AnySchedule[]) {
        const cls = this.classesById[s.class_id] ?? null;

        const availability = await this.reservationSrv.getAvailability(s.id).catch(() => ({
          capacity: Number(s.max_capacity ?? 0),
          booked: Number(s.booked ?? 0),
          free: 0,
          active: s.active !== false
        }));

        const capacity = Number(availability.capacity ?? s.max_capacity ?? 0);
        const booked = Number(availability.booked ?? s.booked ?? 0);
        const percentBooked = capacity > 0 ? Math.round((booked / capacity) * 100) : 0;

        const attendedCount = 0;
        const percentCapacityUsed = capacity > 0 ? Math.round((attendedCount / capacity) * 100) : 0;

        const { startText, endText } = this.getStartEndLocal(s);

        rows.push({
          schedule: s,
          klass: cls,
          startLocal: startText,
          endLocal: endText,
          capacity,
          booked,
          percentBooked,
          attendedCount,
          percentCapacityUsed,
        });
      }

      this.viewList = rows;
    } catch (err) {
      console.error('[admin-browse] loadDay error', err);
      this.viewList = [];
    } finally {
      this.loadingList = false;
      this.slidings?.forEach(sld => sld.closeOpened());
    }
  }

  formatLongDate(s: AnySchedule) {
    const iso = s.start ?? this.composeISO(s.date, s.start_time) ?? s.date;
    const dt = typeof iso === 'string'
      ? DateTime.fromISO(iso, { zone: TZ, locale: LOCALE })
      : this.toDT(iso);
    return dt.isValid ? dt.toFormat("cccc d 'de' LLLL yyyy") : '';
  }

  trackBySchedule = (_: number, row: ViewRow) => row.schedule.id;

  /** Alterna expandido y precarga métricas */
  async toggleExpand(scheduleId: string) {
    this.expandedId = (this.expandedId === scheduleId) ? null : scheduleId;

    if (this.expandedId && !this.detailsByScheduleId[scheduleId]) {
      try {
        const data = await this.reservationSrv.listScheduleReservationsWithUsers(scheduleId);
        this.detailsByScheduleId[scheduleId] = data;
      } catch (e) {
        console.warn('[admin-browse] toggleExpand: sin datos de reservas', e);
        this.detailsByScheduleId[scheduleId] = {
          reservasActivas: 0,
          cancelaciones: 0,
          listado: []
        };
      }
    }
  }

  /** Cálculo de % ocupación para el panel (evita usar Math en template) */
  calcOcupacionPct(row: ViewRow): number {
    const det = this.detailsByScheduleId[row.schedule.id];
    const activas = det?.reservasActivas ?? 0;
    const cap = row.capacity || 0;
    if (cap <= 0) return 0;
    return Math.round((activas / cap) * 100);
  }

  /** Modal: listado de clientes (usa cache si existe) */
  async openClientsFromInline(row: ViewRow) {
    const scheduleId = row.schedule.id;
    this.clientsOpen = true;
    this.clientsLoading = true;

    try {
      if (!this.detailsByScheduleId[scheduleId]) {
        const data = await this.reservationSrv.listScheduleReservationsWithUsers(scheduleId);
        this.detailsByScheduleId[scheduleId] = data;
      }
      const { listado } = this.detailsByScheduleId[scheduleId];

      // 🔎 Log para verificar que lleguen filas al modal
      console.log('[UI][clients modal] scheduleId=', scheduleId, 'listado=', listado);

      this.clientsData = {
        klassName: row.klass?.name || 'Clase',
        dateText: this.formatLongDate(row.schedule),
        startText: row.startLocal,
        endText: row.endLocal,
        listado
      };
    } catch (e) {
      console.error('[admin-browse] openClientsFromInline error', e);
      this.clientsData = {
        klassName: row.klass?.name || 'Clase',
        dateText: this.formatLongDate(row.schedule),
        startText: row.startLocal,
        endText: row.endLocal,
        listado: []
      };
    } finally {
      this.clientsLoading = false;
    }
  }

  closeClients() {
    this.clientsOpen = false;
    this.clientsData = null;
  }
}
