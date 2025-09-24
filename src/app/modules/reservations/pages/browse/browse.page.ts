import { Component, OnInit, ViewChildren, QueryList, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonButton, IonButtons, IonChip, IonCol, IonContent, IonGrid,
  IonHeader, IonIcon, IonImg, IonItem, IonItemOption, IonItemOptions,
  IonItemSliding, IonList, IonRow, IonSkeletonText, IonText, IonTitle, IonToolbar, IonSpinner } from '@ionic/angular/standalone';

import { DateTime } from 'luxon';

import { UtilsService } from '../../../shared/services/utils.service';
import { ClassService } from '../../../core/services/class.service';
import { ReservationService } from '../../../core/services/reservations.service';
import { ScheduleService } from '../../../core/services/schedule.service';

import type { ScheduleClassModelWithId } from '../../../shared/models/schedule-class.model';
import { ClassModelWithIdAndImage } from '../../../shared/models/class.model';

/** Locale y zona horaria en uso */
const LOCALE = 'es';
const TZ = 'America/Bogota';

type Schedule = ScheduleClassModelWithId & { booked?: number; dateKey?: string };

type ViewRow = {
  schedule: Schedule;
  class: ClassModelWithIdAndImage;
  startLocal: string;
  endLocal: string;
  capacity: number;
  booked: number;
  free: number;
  durationText: string;   // para mostrar "45 Minutos"
  startSort: number;      // ordenar por hora real
};

@Component({
  selector: 'app-browse',
  standalone: true,
  templateUrl: './browse.page.html',
  styleUrls: ['./browse.page.scss'],
  imports: [IonSpinner,
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

  /** Etiqueta de fecha amigable en español */
  get selectedLabel(): string {
    return this.selected
      .setLocale(LOCALE)
      .toFormat("cccc d 'de' LLLL 'de' yyyy");
  }

  async ngOnInit() {
    await this.bootstrap();
    this.buildChipDays();
    await this.loadDay(this.selected);
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

  /** Formateo de hora a “h:mm a” respetando locale (a. m. / p. m.) */
  private fmtHmToAmPm(hm: string) {
    const t = hm?.includes('M')
      ? DateTime.fromFormat(hm, 'h:mm a', { zone: TZ, locale: LOCALE })
      : DateTime.fromFormat(hm, 'HH:mm',   { zone: TZ, locale: LOCALE });
    return t.isValid ? t.setLocale(LOCALE).toFormat('h:mm a') : hm;
  }

  /** Abre las opciones deslizables al tocar la tarjeta */
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

      for (const s of (list ?? []) as Schedule[]) {
        let cls = this.classesById[s.class_id];
        if (!cls) {
          cls = {
            id: String(s.class_id),
            name: 'Clase',
            description: '',
            imageURL: 'assets/placeholder-class.jpg',
            createdAt: '', createdBy: '', updatedAt: '', updatedBy: ''
          } as any;
        }

        const capacity = Number(s.max_capacity ?? 0);
        const booked = Number(s.booked ?? 0);

        // Parseo respetando locale y TZ
        let startT = s.start_time?.includes('M')
          ? DateTime.fromFormat(s.start_time, 'h:mm a', { zone: TZ, locale: LOCALE })
          : DateTime.fromFormat(s.start_time, 'HH:mm',   { zone: TZ, locale: LOCALE });

        let endT = s.end_time?.includes('M')
          ? DateTime.fromFormat(s.end_time, 'h:mm a', { zone: TZ, locale: LOCALE })
          : DateTime.fromFormat(s.end_time, 'HH:mm',   { zone: TZ, locale: LOCALE });

        // Anclar al día seleccionado para ordenar y calcular duración
        startT = startT.set({ year: this.selected.year, month: this.selected.month, day: this.selected.day });
        endT   = endT.set({   year: this.selected.year, month: this.selected.month, day: this.selected.day });

        if (endT < startT) endT = endT.plus({ days: 1 }); // por si cruza medianoche

        const durationMin = startT.isValid && endT.isValid
          ? Math.max(0, Math.round(endT.diff(startT, 'minutes').minutes))
          : 0;

        rows.push({
          schedule: s,
          class: cls,
          startLocal: this.fmtHmToAmPm(s.start_time),
          endLocal:   this.fmtHmToAmPm(s.end_time),
          capacity,
          booked,
          free: Math.max(0, capacity - booked),
          durationText: `${durationMin} Minutos`,
          startSort: startT.toMillis(),
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

  async reservar(s: Schedule) {
    const loading = await this.utils.loading();
    await loading.present();
    try {
      this.reservingId = s.id;
      await this.reservationSrv.reserve(s.id, this.currentUserId);

      // Actualizar en memoria
      this.viewList = this.viewList.map(v =>
        v.schedule.id === s.id ? { ...v, booked: v.booked + 1, free: Math.max(0, v.free - 1) } : v
      );

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
