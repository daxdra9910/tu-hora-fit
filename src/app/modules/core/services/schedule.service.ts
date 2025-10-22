// src/app/core/services/schedule.service.ts
import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';

import { COLLECTIONS } from '../../shared/constants/firebase.constant';
import type {
  ScheduleClassModel,
  ScheduleClassModelWithId,
} from '../../shared/models/schedule-class.model';
import { RecurrenceEnum } from '../../shared/enums/recurrence.enum';
import { DateTime } from 'luxon';

// --- Config de tiempo ---
const TZ = 'America/Bogota';
const LOCALE = 'es';

// --- Tipos auxiliares ---
type FireTimestampLike = { toDate: () => Date };
type ScheduleDoc = ScheduleClassModel & { booked?: number; dateKey?: string };
type ScheduleDocWithId = ScheduleClassModelWithId & { booked?: number; dateKey?: string };

// Shape mínimo normalizado (lo usa ReservationService)
export type ScheduleMinimal = {
  id: string;
  idClass: string;
  date?: any;            // original (Timestamp/Date/ISO), se conserva por compatibilidad
  start?: string;        // ISO normalizado (preferido)
  end?: string;          // ISO normalizado (preferido)
  start_time?: string;   // compatibilidad
  end_time?: string;     // compatibilidad
  capacity: number;
  booked: number;
  active: boolean;
  instructor?: string;   // << NUEVO: nombre del entrenador
};

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly firestore = inject(Firestore);
  private readonly collection = COLLECTIONS.SCHEDULES;

  // ========== Utils ==========
  /** Date | Firestore Timestamp | ISO string -> Luxon DateTime */
  private toDT(d: Date | FireTimestampLike | string | undefined | null): DateTime {
    if (!d) return DateTime.invalid('empty');
    if (d instanceof Date) return DateTime.fromJSDate(d, { zone: TZ, locale: LOCALE });
    if (typeof (d as any)?.toDate === 'function') {
      return DateTime.fromJSDate((d as FireTimestampLike).toDate(), { zone: TZ, locale: LOCALE });
    }
    return DateTime.fromISO(String(d), { zone: TZ, locale: LOCALE });
  }

  /** Deriva 'YYYY-MM-DD' desde el campo `date` */
  private computeDateKey(dateLike: Date | FireTimestampLike | string): string {
    return this.toDT(dateLike).toISODate();
  }

  /** Construye un ISO a partir de `date` + `HH:mm` (o `h:mm a`) */
  private composeISO(dateLike: any, timeStr?: string): string | undefined {
    if (!dateLike || !timeStr) return undefined;
    const base = this.toDT(dateLike);
    if (!base.isValid) return undefined;

    // Soportar "HH:mm" y "h:mm a"
    const parsedTime = timeStr.includes('M')
      ? DateTime.fromFormat(timeStr, 'h:mm a', { zone: TZ, locale: LOCALE })
      : DateTime.fromFormat(timeStr, 'HH:mm', { zone: TZ, locale: LOCALE });

    if (!parsedTime.isValid) return undefined;

    const merged = base.set({
      hour: parsedTime.hour,
      minute: parsedTime.minute,
      second: 0,
      millisecond: 0,
    });

    return merged.toISO(); // ISO con zona asignada
  }

  /** Normaliza un schedule a un shape mínimo con start/end ISO */
  private normalizeScheduleMinimal(d: any & { id: string }): ScheduleMinimal {
    const id = d.id;
    const idClass = d.idClass ?? d.class_id ?? d.classId ?? d.id_class;
    const capacity = Number(d.capacity ?? 0);
    const booked = Number(d.booked ?? 0);
    const active = (typeof d.active === 'undefined') ? true : !!d.active;

    // Preferimos campos ISO si existen; si no, componemos desde date + start_time/end_time
    const startISO = d.start ?? this.composeISO(d.date, d.start_time);
    const endISO   = d.end   ?? this.composeISO(d.date, d.end_time);

    // << NUEVO: instructor desde varias variantes comunes
    const instructor =
      d.trainerName ?? d.instructorName ?? d.trainer ?? d.instructor ?? d.coachName ?? undefined;

    return {
      id,
      idClass,
      date: d.date, // se conserva por compatibilidad
      start: startISO,
      end: endISO,
      start_time: d.start_time,
      end_time: d.end_time,
      capacity,
      booked,
      active,
      instructor, // << NUEVO
    };
  }

  /** Genera 1..N ocurrencias según recurrencia manteniendo tu shape */
  private generateRecurringSchedules(schedule: ScheduleClassModel): ScheduleDoc[] {
    const out: ScheduleDoc[] = [];

    const startDate = this.toDT(schedule.date).startOf('day');
    const endDate = schedule.end_recurrence
      ? this.toDT(schedule.end_recurrence).endOf('day')
      : startDate.endOf('day');

    let cur = startDate;
    do {
      out.push({
        ...schedule,
        date: cur.toJSDate(), // Firestore guardará Timestamp
        booked: Number((schedule as any).booked ?? 0),
      });

      if (schedule.recurrence === RecurrenceEnum.ONCE) break;
      if (schedule.recurrence === RecurrenceEnum.DAILY)   cur = cur.plus({ days: 1 });
      else if (schedule.recurrence === RecurrenceEnum.WEEKLY)  cur = cur.plus({ weeks: 1 });
      else if (schedule.recurrence === RecurrenceEnum.MONTHLY) cur = cur.plus({ months: 1 });
      else break;
    } while (cur <= endDate);

    return out;
  }

  // ========== API ==========
  /** Crea schedules (con recurrencia) y persiste `dateKey` + `booked` */
  async createSchedule(schedule: ScheduleClassModel): Promise<void> {
    const instances = this.generateRecurringSchedules(schedule);

    for (const sched of instances) {
      const id = crypto.randomUUID();
      const ref = doc(this.firestore, this.collection, id);
      const dateKey = this.computeDateKey(sched.date);

      await setDoc(ref, {
        ...sched,
        dateKey, // <- usado por tu índice
        booked: Number((sched as any).booked ?? 0),
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
        active: schedule.active !== false,
      } as any);
    }
  }

  /** Lista todos los schedules (sin filtro) */
  async getAllSchedules(): Promise<ScheduleClassModelWithId[]> {
    const colRef = collection(this.firestore, this.collection);
    const snap = await getDocs(colRef);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleClassModelWithId[];
  }

  /**
   * 🔎 Schedules por día (YYYY-MM-DD) con compatibilidad legacy + nuevo
   * 1) Query por índice: active + dateKey (SIN orderBy en Firestore)
   * 2) Fallback legacy: rango por 'date' (Timestamp/Date)
   * 3) Fallback nuevo: rango por 'start' (ISO) — requiere índice (active ASC, start ASC)
   * 4) Si hay resultados, SIEMPRE se ordenan en cliente por hora real (ISO o legacy)
   */
  async getSchedulesByDay(dayKey: string): Promise<ScheduleDocWithId[]> {
    const colRef = collection(this.firestore, this.collection);

    // 1) Camino principal: active + dateKey (sin orderBy para no exigir 'start_time')
    try {
      const q1 = query(
        colRef,
        where('active', '==', true),
        where('dateKey', '==', dayKey),
      );
      const s1 = await getDocs(q1);
      if (!s1.empty) {
        const raw = s1.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleDocWithId[];
        return this.sortByStartLike(raw, dayKey);
      }
    } catch { /* seguimos a fallbacks */ }

    // 2) Fallback legacy: rango por 'date' (Timestamp/Date) -> [start, nextDay)
    try {
      const day = DateTime.fromISO(dayKey, { zone: TZ, locale: LOCALE });
      const start = day.startOf('day').toJSDate();
      const end   = day.plus({ days: 1 }).startOf('day').toJSDate();

      const q2 = query(
        colRef,
        where('active', '==', true),
        where('date', '>=', start),
        where('date', '<', end),
        orderBy('date', 'asc')
      );
      const s2 = await getDocs(q2);
      if (!s2.empty) {
        const raw = s2.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleDocWithId[];
        return this.sortByStartLike(raw, dayKey);
      }
    } catch { /* seguimos */ }

    // 3) Fallback nuevo: rango por 'start' (ISO).
    try {
      const day = DateTime.fromISO(dayKey, { zone: TZ, locale: LOCALE });
      const startISO = day.startOf('day').toISO();
      const endISO   = day.plus({ days: 1 }).startOf('day').toISO();

      const q3 = query(
        colRef,
        where('active', '==', true),
        where('start', '>=', startISO),
        where('start', '<', endISO),
        orderBy('start', 'asc')
      );
      const s3 = await getDocs(q3);
      if (!s3.empty) {
        const raw = s3.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleDocWithId[];
        return this.sortByStartLike(raw, dayKey);
      }
    } catch (e) {
      // Si ves "FAILED_PRECONDITION: The query requires an index",
      // crea el índice compuesto: schedules: active (ASC), start (ASC).
    }

    // 4) Sin resultados
    return [];
  }

  /** Ordena con preferencia: start (ISO) -> compose(date+start_time) -> start_time anclado al día */
  private sortByStartLike(list: ScheduleDocWithId[], dayKey: string): ScheduleDocWithId[] {
    const day = DateTime.fromISO(dayKey, { zone: TZ, locale: LOCALE });

    const toDT = (d: any): DateTime => {
      if (!d) return DateTime.invalid('empty');
      if (d instanceof Date) return DateTime.fromJSDate(d, { zone: TZ, locale: LOCALE });
      if (typeof d?.toDate === 'function') return DateTime.fromJSDate(d.toDate(), { zone: TZ, locale: LOCALE });
      return DateTime.fromISO(String(d), { zone: TZ, locale: LOCALE });
    };

    const composeISO = (dateLike: any, timeStr?: string): string | undefined => {
      if (!dateLike || !timeStr) return undefined;
      const base = toDT(dateLike);
      if (!base.isValid) return undefined;
      const parsed = timeStr.includes('M')
        ? DateTime.fromFormat(timeStr, 'h:mm a', { zone: TZ, locale: LOCALE })
        : DateTime.fromFormat(timeStr, 'HH:mm',   { zone: TZ, locale: LOCALE });
      if (!parsed.isValid) return undefined;
      return base.set({ hour: parsed.hour, minute: parsed.minute, second: 0, millisecond: 0 }).toISO();
    };

    const sortKey = (x: any): number => {
      // 1) start ISO si existe
      let iso = x?.start as string | undefined;

      // 2) si no, componer desde date + start_time
      if (!iso && (x?.date && x?.start_time)) iso = composeISO(x.date, x.start_time);

      // 3) si aún no, usar start_time pegado al día seleccionado (orden estable)
      if (!iso && x?.start_time) {
        const t = x.start_time.includes('M')
          ? DateTime.fromFormat(x.start_time, 'h:mm a', { zone: TZ, locale: LOCALE })
          : DateTime.fromFormat(x.start_time, 'HH:mm',   { zone: TZ, locale: LOCALE });
        if (t.isValid) {
          iso = day.set({ hour: t.hour, minute: t.minute, second: 0, millisecond: 0 }).toISO();
        }
      }

      const dt = iso ? DateTime.fromISO(iso, { zone: TZ, locale: LOCALE }) : DateTime.invalid('no-time');
      return dt.isValid ? dt.toMillis() : Number.MAX_SAFE_INTEGER;
    };

    return [...list].sort((a, b) => sortKey(a) - sortKey(b));
  }

  /**
   * (Opcional) Rango de días [startDay, endDay), ordenado por fecha y hora (legacy)
   * Útil para vistas semanal/mensual cuando dependes de dateKey + start_time.
   */
  async getSchedulesInRangeByDateKey(startDayISO: string, endDayISOExclusive: string): Promise<ScheduleDocWithId[]> {
    const colRef = collection(this.firestore, this.collection);
    const qy = query(
      colRef,
      where('active', '==', true),
      where('dateKey', '>=', startDayISO),
      where('dateKey', '<', endDayISOExclusive),
      orderBy('dateKey', 'asc'),
      orderBy('start_time', 'asc')
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleDocWithId[];
  }

  /** Actualiza y, si cambia `date`, recalcula `dateKey` */
  async updateSchedule(id: string, data: Partial<ScheduleClassModel>): Promise<void> {
    const ref = doc(this.firestore, this.collection, id);

    const patch: any = {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system',
    };

    if (data?.date) {
      patch.dateKey = this.computeDateKey(data.date);
    }

    await updateDoc(ref, patch);
  }

  /** Elimina un schedule */
  async deleteSchedule(id: string): Promise<void> {
    const ref = doc(this.firestore, this.collection, id);
    await deleteDoc(ref);
  }

  // ========== NUEVO: obtener por IDs (raw) ==========
  /** Trae schedules por IDs (chunk de 10 para Firestore `in`) */
  async getByIds(ids: string[]): Promise<ScheduleDocWithId[]> {
    if (!ids?.length) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    const colRef = collection(this.firestore, this.collection);
    const out: ScheduleDocWithId[] = [];

    for (const part of chunks) {
      const qy = query(colRef, where('__name__', 'in', part));
      const snap = await getDocs(qy);
      out.push(...snap.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleDocWithId[]);
    }
    return out;
  }

  // ========== NUEVO: obtener por IDs NORMALIZADO ==========
  /**
   * Igual a `getByIds` pero normaliza a un shape mínimo con `start`/`end` ISO.
   * Esto permite que ReservationService trabaje siempre con ISO aunque en la DB
   * tengas `date` + `start_time`/`end_time`.
   */
  async getByIdsNormalized(ids: string[]): Promise<ScheduleMinimal[]> {
    const raws = await this.getByIds(ids);
    return raws.map(d => this.normalizeScheduleMinimal(d));
  }

  // ========== Utilidades de mantenimiento (opcional) ==========

  /** Rellena `dateKey` cuando falta (córrerla una sola vez si tienes docs viejos). */
  async repairDateKeysOnce(limitBatch = 200): Promise<number> {
    const colRef = collection(this.firestore, this.collection);
    const snap = await getDocs(colRef);
    let fixed = 0;

    for (const d of snap.docs.slice(0, limitBatch)) {
      const data = d.data() as any;
      if (!data?.date || data?.dateKey) continue;
      const key = this.computeDateKey(data.date);
      await updateDoc(d.ref, {
        dateKey: key,
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
      });
      fixed++;
    }
    return fixed;
  }

  /** Normaliza `dateKey`, `active` y `booked` en todos los docs (córrela una sola vez si hace falta). */
  async normalizeAllSchedulesOnce(): Promise<number> {
    const colRef = collection(this.firestore, this.collection);
    const snap = await getDocs(colRef);
    let fixed = 0;
    for (const d of snap.docs) {
      const data = d.data() as any;
      const patch: any = {};
      if (!data?.dateKey || typeof data.dateKey !== 'string') {
        if (data?.date) patch.dateKey = this.computeDateKey(data.date);
      }
      if (typeof data.active === 'undefined') patch.active = true;
      if (typeof data.booked !== 'number') patch.booked = Number(data.booked ?? 0);
      if (Object.keys(patch).length) {
        patch.updatedAt = new Date().toISOString();
        patch.updatedBy = 'system';
        await updateDoc(d.ref, patch);
        fixed++;
      }
    }
    return fixed;
  }
}
