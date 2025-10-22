import { Component, OnInit, ViewChildren, QueryList, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton, IonButtons, IonChip, IonCol, IonContent, IonGrid,
  IonHeader, IonIcon, IonImg, IonItem, IonItemOption, IonItemOptions,
  IonItemSliding, IonList, IonRow, IonSkeletonText, IonText, IonTitle, IonToolbar, IonSpinner
} from '@ionic/angular/standalone';

import { DateTime } from 'luxon';

import { UtilsService } from '../../../shared/services/utils.service';
import { ClassService } from '../../../core/services/class.service';
import { ReservationService, ReservationModel } from '../../../core/services/reservations.service';
import { ScheduleService } from '../../../core/services/schedule.service';

import type { ScheduleClassModelWithId } from '../../../shared/models/schedule-class.model';
import { ClassModelWithIdAndImage } from '../../../shared/models/class.model';

/** Locale y zona horaria en uso */
const LOCALE = 'es';
const TZ = 'America/Bogota';

type AnySchedule = (ScheduleClassModelWithId & {
  booked?: number;
  dateKey?: string;
  start?: string;      // ISO
  end?: string;        // ISO
  start_time?: string; // legacy
  end_time?: string;   // legacy
  capacity?: number;   // nuevo
  max_capacity?: number; // legacy
  idClass?: string;    // nuevo
  class_id?: string;   // legacy
  date?: any;          // Timestamp/Date/ISO
});

type ViewRow = {
  schedule: AnySchedule;
  class: ClassModelWithIdAndImage;
  startLocal: string;
  endLocal: string;
  capacity: number;
  booked: number;
  free: number;
  durationText: string;
  startSort: number;
  past: boolean;           // 👈 NUEVO: ya pasó (fin o inicio)
};

@Component({
  selector: 'app-browse',
  standalone: true,
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  imports: [
    IonSpinner,
    CommonModule, FormsModule,
    IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon,
    IonText, IonList, IonItem, IonItemSliding, IonItemOptions, IonItemOption,
    IonGrid, IonRow, IonCol, IonChip, IonImg, IonSkeletonText
  ],
})
export class BrowsePage implements OnInit {
  private readonly utils = inject(UtilsService);
  private readonly classesSrv = inject(ClassService);
  private readonly scheduleSrv = inject(ScheduleService);
  private readonly reservationSrv = inject(ReservationService);

  @ViewChildren(IonItemSliding) slidings!: QueryList<IonItemSliding>;

  classesById: Record<string, ClassModelWithIdAndImage> = {};

  // Día seleccionado con TZ + locale ES
  selected = DateTime.now().setZone(TZ).setLocale(LOCALE).startOf('day');
  chipDays: DateTime[] = [];

  viewList: ViewRow[] = [];
  reservingId: string | null = null;
  loadingList = false;

  // TODO: reemplazar por el UID real del usuario autenticado
  currentUserId = 'system';

  // 👉 Schedules ya reservados por el usuario (para bloquear UI)
  private reservedScheduleIds = new Set<string>();

  /** Etiqueta de fecha amigable en español */
  get selectedLabel(): string {
    return this.selected
      .setLocale(LOCALE)
      .toFormat("cccc d 'de' LLLL 'de' yyyy");
  }

  async ngOnInit() {
    await this.bootstrap();
    await this.refreshUserReserved();
    this.buildChipDays();
    await this.loadDay(this.selected);
  }

  private async refreshUserReserved() {
    try {
      const list = await this.reservationSrv.listUserActiveReservations(this.currentUserId, 200);
      this.reservedScheduleIds.clear();
      for (const r of list as ReservationModel[]) {
        if (r.active) this.reservedScheduleIds.add(r.scheduleId);
      }
    } catch (e) {
      console.warn('[browse] no se pudo cargar reservas del usuario', e);
    }
  }

  isReserved(scheduleId: string) {
    return this.reservedScheduleIds.has(scheduleId);
  }

  private async bootstrap() {
    const loading = await this.utils.loading();
    await loading.present();
    try {
      const classes = await this.classesSrv.getAllClasses();
      const map: Record<string, ClassModelWithIdAndImage> = {};
      classes.forEach((c) => (map[c.id] = c));
      this.classesById = map;
    } catch (err: any) {
      await this.utils.presentToast({
        message: err?.message ?? 'No se pudieron cargar las clases',
        duration: 2500, color: 'danger', position: 'bottom', icon: 'alert-circle-outline',
      });
    } finally {
      loading.dismiss();
    }
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

  /** Am/pm en español (a. m. / p. m.) desde "HH:mm" o "h:mm a" */
  private fmtHmToAmPm(hm: string) {
    const t = hm?.includes('M')
      ? DateTime.fromFormat(hm, 'h:mm a', { zone: TZ, locale: LOCALE })
      : DateTime.fromFormat(hm, 'HH:mm',   { zone: TZ, locale: LOCALE });
    return t.isValid ? t.setLocale(LOCALE).toFormat('h:mm a') : hm;
  }

  private toDT(d: any): DateTime {
    if (!d) return DateTime.invalid('empty');
    if (d instanceof Date) return DateTime.fromJSDate(d, { zone: TZ, locale: LOCALE });
    if (typeof d?.toDate === 'function') return DateTime.fromJSDate(d.toDate(), { zone: TZ, locale: LOCALE });
    return DateTime.fromISO(String(d), { zone: TZ, locale: LOCALE });
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

  private getStartEndISO(s: AnySchedule): { startISO?: string; endISO?: string } {
    const rawStartISO = s.start || this.composeISO(s.date, s.start_time);
    const rawEndISO   = s.end   || this.composeISO(s.date, s.end_time);

    if (!rawStartISO && !rawEndISO) return {};

    const day = this.selected;
    let start = rawStartISO ? DateTime.fromISO(String(rawStartISO), { zone: TZ, locale: LOCALE }) : null;
    let end   = rawEndISO   ? DateTime.fromISO(String(rawEndISO),   { zone: TZ, locale: LOCALE }) : null;

    if (start?.isValid) start = start.set({ year: day.year, month: day.month, day: day.day });
    if (end?.isValid)   end   = end.set({   year: day.year, month: day.month, day: day.day });

    if (start?.isValid && end?.isValid && end < start) end = end.plus({ days: 1 });

    return {
      startISO: start?.toISO(),
      endISO: end?.toISO(),
    };
  }

  openSlide(sliding: IonItemSliding) {
    try { sliding.open('end'); } catch {}
  }

  /** Carga horarios del día seleccionado */
  private async loadDay(d: DateTime) {
    const dayKey = d.setZone(TZ).toFormat('yyyy-LL-dd');
    this.loadingList = true;
    try {
      const list = await this.scheduleSrv.getSchedulesByDay(dayKey);
      const rows: ViewRow[] = [];
      const now = DateTime.now().setZone(TZ).setLocale(LOCALE);

      for (const s of (list ?? []) as AnySchedule[]) {
        // ---- Clase
        const classId = (s as any).idClass || (s as any).class_id;
        let cls = this.classesById[classId];
        if (!cls) {
          cls = {
            id: String(classId ?? ''),
            name: 'Clase',
            description: '',
            imageURL: 'assets/placeholder-class.jpg',
            createdAt: '', createdBy: '', updatedAt: '', updatedBy: ''
          } as any;
        }

        // ---- Cupos
        const capacity = Number((s as any).capacity ?? (s as any).max_capacity ?? 0);
        const booked = Number((s as any).booked ?? 0);
        const free = Math.max(0, capacity - booked);

        // ---- Horarios
        const { startISO, endISO } = this.getStartEndISO(s);

        let startT: DateTime | null = startISO ? DateTime.fromISO(startISO, { zone: TZ, locale: LOCALE }) : null;
        let endT: DateTime | null   = endISO   ? DateTime.fromISO(endISO,   { zone: TZ, locale: LOCALE }) : null;

        // Legacy fallback
        if (!startT?.isValid || !endT?.isValid) {
          let legacyStart = (s as any).start_time?.includes('M')
            ? DateTime.fromFormat((s as any).start_time || '', 'h:mm a', { zone: TZ, locale: LOCALE })
            : DateTime.fromFormat((s as any).start_time || '', 'HH:mm',   { zone: TZ, locale: LOCALE });

          let legacyEnd = (s as any).end_time?.includes('M')
            ? DateTime.fromFormat((s as any).end_time || '', 'h:mm a', { zone: TZ, locale: LOCALE })
            : DateTime.fromFormat((s as any).end_time || '', 'HH:mm',   { zone: TZ, locale: LOCALE });

          if (legacyStart?.isValid) legacyStart = legacyStart.set({ year: d.year, month: d.month, day: d.day });
          if (legacyEnd?.isValid)   legacyEnd   = legacyEnd.set({   year: d.year, month: d.month, day: d.day });
          if (legacyStart?.isValid && legacyEnd?.isValid && legacyEnd < legacyStart) legacyEnd = legacyEnd.plus({ days: 1 });

          startT = legacyStart?.isValid ? legacyStart : startT;
          endT   = legacyEnd?.isValid   ? legacyEnd   : endT;
        }

        const durationMin = (startT?.isValid && endT?.isValid)
          ? Math.max(0, Math.round(endT.diff(startT, 'minutes').minutes))
          : 0;

        // Etiquetas
        const startLocal =
          startT?.isValid
            ? startT.toFormat('h:mm a')
            : this.fmtHmToAmPm((s as any).start_time || '');

        const endLocal =
          endT?.isValid
            ? endT.toFormat('h:mm a')
            : this.fmtHmToAmPm((s as any).end_time || '');

        // 👇 pasado: si existe end usamos end<=now; si no, start<=now
        const past = endT?.isValid ? endT <= now : (startT?.isValid ? startT <= now : false);

        rows.push({
          schedule: s,
          class: cls,
          startLocal,
          endLocal,
          capacity,
          booked,
          free,
          durationText: `${durationMin} Minutos`,
          startSort: (startT?.isValid ? startT.toMillis() : 0),
          past,
        });
      }

      rows.sort((a, b) => a.startSort - b.startSort);
      this.viewList = rows;
    } catch (err: any) {
      console.error('[browse] loadDay error', err);
      this.viewList = [];
      await this.utils.presentToast({
        message: err?.message ?? 'Error al cargar horarios',
        duration: 2500, color: 'danger', position: 'bottom', icon: 'alert-circle-outline',
      });
    } finally {
      this.loadingList = false;
      this.slidings?.forEach(sld => sld.closeOpened());
    }
  }

  async reservar(s: AnySchedule) {
    // UI guards
    if (this.isReserved(s.id)) {
      await this.utils.presentToast({
        message: 'Ya tienes una reserva para este horario.',
        duration: 2000, color: 'medium', position: 'bottom', icon: 'information-circle-outline',
      });
      return;
    }

    // También bloqueamos si ya pasó (defensivo en UI)
    const { startISO, endISO } = this.getStartEndISO(s);
    const now = DateTime.now().setZone(TZ);
    const start = startISO ? DateTime.fromISO(startISO, { zone: TZ }) : null;
    const end   = endISO   ? DateTime.fromISO(endISO,   { zone: TZ }) : null;
    const past = end?.isValid ? end <= now : (start?.isValid ? start <= now : false);
    if (past) {
      await this.utils.presentToast({
        message: 'Este horario ya no está disponible.',
        duration: 2200, color: 'warning', position: 'bottom', icon: 'alert-circle-outline',
      });
      return;
    }

    const loading = await this.utils.loading();
    await loading.present();
    try {
      this.reservingId = s.id;
      await this.reservationSrv.reserve(s.id, this.currentUserId);

      // Actualizar en memoria (cupos)
      this.viewList = this.viewList.map(v =>
        v.schedule.id === s.id ? { ...v, booked: v.booked + 1, free: Math.max(0, v.free - 1) } : v
      );

      // Marcar como reservada en el set local para bloquear de inmediato
      this.reservedScheduleIds.add(s.id);

      await this.utils.presentToast({
        message: '¡Reserva confirmada!', duration: 2000, color: 'success',
        position: 'bottom', icon: 'checkmark-circle-outline',
      });
    } catch (err: any) {
      await this.utils.presentToast({
        message: err?.message ?? 'No se pudo reservar',
        duration: 2500, color: 'danger', position: 'bottom', icon: 'alert-circle-outline',
      });
    } finally {
      this.reservingId = null;
      loading.dismiss();
      this.slidings?.forEach(sld => sld.closeOpened());
    }
  }
}
