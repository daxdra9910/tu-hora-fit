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

// --- Tipos auxiliares ---
type FireTimestampLike = { toDate: () => Date };
type ScheduleDoc = ScheduleClassModel & { booked?: number; dateKey?: string };
type ScheduleDocWithId = ScheduleClassModelWithId & { booked?: number; dateKey?: string };

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly firestore = inject(Firestore);
  private readonly collection = COLLECTIONS.SCHEDULES;

  // ========== Utils ==========
  /** Date | Firestore Timestamp | ISO string -> Luxon DateTime */
  private toDT(d: Date | FireTimestampLike | string): DateTime {
    if (!d) return DateTime.invalid('empty');
    if (d instanceof Date) return DateTime.fromJSDate(d);
    if (typeof (d as any)?.toDate === 'function') return DateTime.fromJSDate((d as FireTimestampLike).toDate());
    return DateTime.fromISO(String(d));
  }

  /** Deriva 'YYYY-MM-DD' desde el campo `date` */
  private computeDateKey(dateLike: Date | FireTimestampLike | string): string {
    return this.toDT(dateLike).toISODate();
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
   * 🔎 Schedules por día (YYYY-MM-DD)
   * 1) Intenta por índice: active + dateKey + start_time
   * 2) Si no hay resultados, intenta por dateKey sin 'active'
   * 3) Si aún no, cae a rango por 'date' (Timestamp/Date), primero con 'active' y luego sin él
   * 4) Último recurso: trae todo y filtra en cliente (para desarrollo)
   */
  async getSchedulesByDay(dayKey: string): Promise<ScheduleDocWithId[]> {
    const colRef = collection(this.firestore, this.collection);

    // 1) Camino normal: índice (active + dateKey + start_time)
    try {
      const q1 = query(
        colRef,
        where('active', '==', true),
        where('dateKey', '==', dayKey),
        orderBy('start_time', 'asc')
      );
      const s1 = await getDocs(q1);
      if (!s1.empty) {
        return s1.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleDocWithId[];
      }
    } catch { /* seguimos a fallbacks */ }

    // 1b) Por si los docs no tienen 'active'
    try {
      const q1b = query(
        colRef,
        where('dateKey', '==', dayKey),
        orderBy('start_time', 'asc')
      );
      const s1b = await getDocs(q1b);
      if (!s1b.empty) {
        return s1b.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleDocWithId[];
      }
    } catch { /* seguimos abajo */ }

    // 2) Fallback por rango de 'date' (Timestamp/Date) -> [start, nextDay)
    const day = DateTime.fromISO(dayKey);
    const start = day.startOf('day').toJSDate();
    const end   = day.plus({ days: 1 }).startOf('day').toJSDate();

    // 2a) Con active
    try {
      const q2 = query(
        colRef,
        where('active', '==', true),
        where('date', '>=', start),
        where('date', '<', end),
        orderBy('date', 'asc')
      );
      const s2 = await getDocs(q2);
      if (!s2.empty) {
        return s2.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleDocWithId[];
      }
    } catch {
      // 2b) Sin active (por si faltara ese campo)
      try {
        const q2b = query(
          colRef,
          where('date', '>=', start),
          where('date', '<', end),
          orderBy('date', 'asc')
        );
        const s2b = await getDocs(q2b);
        if (!s2b.empty) {
          return s2b.docs.map(d => ({ ...(d.data() as any), id: d.id })) as ScheduleDocWithId[];
        }
      } catch { /* último recurso abajo */ }
    }

    // 3) Último recurso: traer todo y filtrar en cliente (para desarrollo)
    const allSnap = await getDocs(colRef);
    const all = allSnap.docs.map(d => ({ ...(d.data() as any), id: d.id }));
    const filtered = all.filter((x: any) => {
      const raw = x?.date;
      let jsDate: Date | null = null;
      if (raw?.toDate) jsDate = raw.toDate();
      else if (raw instanceof Date) jsDate = raw;
      else if (typeof raw === 'string') jsDate = new Date(raw);
      if (!jsDate) return false;
      const key = DateTime.fromJSDate(jsDate).toISODate();
      return key === dayKey;
    });
    filtered.sort((a: any, b: any) => String(a?.start_time ?? '').localeCompare(String(b?.start_time ?? '')));
    return filtered as ScheduleDocWithId[];
  }

  /**
   * (Opcional) Rango de días [startDay, endDay), ordenado por fecha y hora
   * Útil para vistas semanal/mensual.
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
