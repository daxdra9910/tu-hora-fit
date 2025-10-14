import { inject, Injectable } from '@angular/core';
import {
  Firestore, doc, collection, runTransaction, serverTimestamp, getDoc, getDocs,
  query, where, orderBy, limit, updateDoc, writeBatch
} from '@angular/fire/firestore';
import { DateTime } from 'luxon';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';

/** Zona y locale */
const TZ = 'America/Bogota';
const LOCALE = 'es';

/** Modelos base */
export interface ReservationModel {
  id: string;
  scheduleId: string;
  userId: string;
  createdAt: any;       // serverTimestamp
  cancelledAt?: any;    // serverTimestamp
  active: boolean;
}

export interface ScheduleMinimal {
  id: string;
  idClass: string;
  date?: any;
  start: string;
  end?: string;
  capacity: number;
  booked: number;
  active: boolean;
}

export interface ClassModelMin {
  id: string;
  name: string;
  description?: string;
  imageURL?: string;
}

type DetailedUserReservation = {
  reservation: ReservationModel;
  schedule: Pick<ScheduleMinimal, 'id' | 'idClass' | 'start' | 'end'>;
  class: ClassModelMin;
  startLocal: string;
  endLocal: string;
  minutesLeft: number;
  canCancel: boolean;
};

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly firestore = inject(Firestore);

  private schedulesCol = COLLECTIONS.SCHEDULES;
  private reservationsCol = COLLECTIONS.RESERVATIONS;
  private classesCol = COLLECTIONS.CLASSES;

  /* ==================== Utils de tiempo ==================== */
  private toDT(d: any): DateTime {
    if (!d) return DateTime.invalid('empty');
    if (d instanceof Date) return DateTime.fromJSDate(d, { zone: TZ, locale: LOCALE });
    if (typeof d?.toDate === 'function') {
      return DateTime.fromJSDate(d.toDate(), { zone: TZ, locale: LOCALE });
    }
    return DateTime.fromISO(String(d), { zone: TZ, locale: LOCALE });
  }

  private fmtLocal(iso?: string) {
    if (!iso) return '';
    const dt = DateTime.fromISO(iso, { zone: TZ, locale: LOCALE });
    return dt.isValid ? dt.toFormat("cccc d 'de' LLLL, h:mm a") : '';
  }

  private minsLeft(iso?: string) {
    if (!iso) return -99999;
    const now = DateTime.now().setZone(TZ).setLocale(LOCALE);
    const start = DateTime.fromISO(iso, { zone: TZ, locale: LOCALE });
    return Math.floor(start.diff(now, 'minutes').minutes);
  }

  private canCancelAt(iso?: string) {
    return this.minsLeft(iso) >= 60;
  }

  /* ========== Normalización de schedules (start/end ISO) ========== */
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

  /** Doc crudo -> ScheduleMinimal (acepta capacity o max_capacity) */
  private normalizeScheduleDoc(d: any & { id: string }): ScheduleMinimal {
    const id = d.id;
    const idClass = d.idClass ?? d.class_id ?? d.classId ?? d.id_class;
    const capacity = Number(d.capacity ?? d.max_capacity ?? 0);
    const booked = Number(d.booked ?? 0);
    const active = (typeof d.active === 'undefined') ? true : !!d.active;

    const startISO: string =
      d.start
        ?? this.composeISO(d.date, d.start_time)
        ?? this.toDT(d.date).toISO();

    const endISO: string | undefined =
      d.end
        ?? this.composeISO(d.date, d.end_time);

    return {
      id,
      idClass,
      date: d.date,
      start: String(startISO),
      end: endISO ? String(endISO) : undefined,
      capacity,
      booked,
      active,
    };
  }

  /* ========== HELPERS DE LECTURA (CHUNKED IN) ========== */
  private async getSchedulesByIds(ids: string[]) {
    if (!ids?.length) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));

    const out: ScheduleMinimal[] = [];
    for (const part of chunks) {
      const qs = query(collection(this.firestore, this.schedulesCol), where('__name__', 'in', part));
      const snap = await getDocs(qs);
      out.push(...snap.docs.map(d => this.normalizeScheduleDoc({ id: d.id, ...(d.data() as any) })));
    }
    return out;
  }

  private async getClassesByIds(ids: string[]) {
    if (!ids?.length) return [];
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += 10) chunks.push(ids.slice(i, i + 10));
    const out: any[] = [];
    for (const part of chunks) {
      const qs = query(collection(this.firestore, this.classesCol), where('__name__', 'in', part));
      const snap = await getDocs(qs);
      out.push(...snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }
    return out as ClassModelMin[];
  }

  /* ==================== RESERVAR (TX) ==================== */
  async reserve(scheduleId: string, userId: string): Promise<{ id: string }> {
    const scheduleRef = doc(this.firestore, this.schedulesCol, scheduleId);

    // Idempotencia fuera de la TX (rápida): si ya existe activa, reusar
    const existing = await this.findActiveReservationByUser(scheduleId, userId);
    if (existing) return { id: existing.id };

    const reservationId = crypto.randomUUID();
    const reservationRef = doc(this.firestore, this.reservationsCol, reservationId);

    await runTransaction(this.firestore, async (tx) => {
      const schedSnap = await tx.get(scheduleRef);
      if (!schedSnap.exists()) throw new Error('El horario no existe.');
      const s = schedSnap.data() as any;

      if (s.active === false) throw new Error('Este horario no está activo.');

      // ⛔ Bloquear si ya inició/terminó (usamos end si existe; si no, start)
      const startISO: string =
        s.start ?? this.composeISO(s.date, s.start_time) ?? this.toDT(s.date).toISO();
      const endISO: string | undefined =
        s.end ?? this.composeISO(s.date, s.end_time);

      const now = DateTime.now().setZone(TZ);
      const start = DateTime.fromISO(String(startISO), { zone: TZ });
      const end   = endISO ? DateTime.fromISO(String(endISO), { zone: TZ }) : null;

      if (!start.isValid) throw new Error('Horario inválido.');
      if (end?.isValid ? end <= now : start <= now) {
        // si hay end, pasó si end<=now; si no hay end, pasó si start<=now
        throw new Error('Este horario ya no está disponible.');
      }

      const capacity = Number(s.capacity ?? s.max_capacity ?? 0);
      const booked = Number(s.booked ?? 0);
      if (booked >= capacity) throw new Error('No hay cupos disponibles.');

      // Duplicado dentro de la TX
      const dupQ = query(
        collection(this.firestore, this.reservationsCol),
        where('scheduleId', '==', scheduleId),
        where('userId', '==', userId),
        where('active', '==', true),
        limit(1)
      );
      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) throw new Error('Ya tienes una reserva activa para este horario.');

      tx.update(scheduleRef, {
        booked: booked + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      });

      tx.set(reservationRef, {
        id: reservationId,
        scheduleId,
        userId,
        createdAt: serverTimestamp(),
        active: true
      } as Partial<ReservationModel>);
    });

    return { id: reservationId };
  }

  /* ==================== CANCELAR (TX, 60 min) ==================== */
  async cancel(reservationId: string, userId: string, bypassUserCheck = false): Promise<void> {
    const reservationRef = doc(this.firestore, this.reservationsCol, reservationId);

    await runTransaction(this.firestore, async (tx) => {
      const rSnap = await tx.get(reservationRef);
      if (!rSnap.exists()) throw new Error('La reserva no existe.');
      const r = rSnap.data() as ReservationModel;
      if (!r.active) return; // idempotente

      if (!bypassUserCheck && r.userId !== userId) {
        throw new Error('No puedes cancelar esta reserva.');
      }

      const scheduleRef = doc(this.firestore, this.schedulesCol, r.scheduleId);
      const sSnap = await tx.get(scheduleRef);
      if (!sSnap.exists()) throw new Error('El horario de la reserva no existe.');
      const s = sSnap.data() as any;

      // ✅ Regla estricta de 60 minutos
      const startISO =
        s.start
        ?? this.composeISO(s.date, s.start_time)
        ?? this.toDT(s.date).toISO();

      const start = DateTime.fromISO(String(startISO), { zone: TZ, locale: LOCALE });
      const now = DateTime.now().setZone(TZ).setLocale(LOCALE);
      if (!start.isValid) throw new Error('Horario inválido.');
      const diffMin = Math.floor(start.diff(now, 'minutes').minutes);
      if (diffMin < 60) throw new Error('Solo puedes cancelar hasta 60 minutos antes de la clase.');

      const booked = Number(s.booked ?? 0);

      tx.update(reservationRef, { active: false, cancelledAt: serverTimestamp() });
      tx.update(scheduleRef, {
        booked: Math.max(0, booked - 1),
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      });
    });
  }

  /* ==================== QUERIES BÁSICAS ==================== */
  async findActiveReservationByUser(scheduleId: string, userId: string) {
    const qy = query(
      collection(this.firestore, this.reservationsCol),
      where('scheduleId', '==', scheduleId),
      where('userId', '==', userId),
      where('active', '==', true),
      limit(1)
    );
    const snap = await getDocs(qy);
    if (snap.empty) return null;
    return snap.docs[0].data() as ReservationModel;
  }

  async listUserActiveReservations(userId: string, top = 50) {
    const qy = query(
      collection(this.firestore, this.reservationsCol),
      where('userId', '==', userId),
      where('active', '==', true),
      orderBy('createdAt', 'desc'),
      limit(top)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => d.data() as ReservationModel);
  }

  async listScheduleReservations(scheduleId: string) {
    const qy = query(
      collection(this.firestore, this.reservationsCol),
      where('scheduleId', '==', scheduleId),
      where('active', '==', true)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => d.data() as ReservationModel);
  }

  async getAvailability(scheduleId: string) {
    const scheduleRef = doc(this.firestore, this.schedulesCol, scheduleId);
    const snap = await getDoc(scheduleRef);
    if (!snap.exists()) throw new Error('Horario no encontrado');
    const s = snap.data() as any;
    const capacity = Number(s.capacity ?? s.max_capacity ?? 0);
    const booked = Number(s.booked ?? 0);
    return { capacity, booked, free: Math.max(0, capacity - booked), active: s.active !== false };
  }

  /** Admin: cancelar todas las activas de un schedule y resetear cupos */
  async cancelAllForSchedule(scheduleId: string): Promise<number> {
    const qy = query(
      collection(this.firestore, this.reservationsCol),
      where('scheduleId', '==', scheduleId),
      where('active', '==', true)
    );
    const snap = await getDocs(qy);
    const batch = writeBatch(this.firestore);
    let count = 0;
    for (const d of snap.docs) {
      batch.update(d.ref, { active: false, cancelledAt: serverTimestamp() });
      count++;
    }
    await batch.commit();

    const scheduleRef = doc(this.firestore, this.schedulesCol, scheduleId);
    await updateDoc(scheduleRef, { booked: 0, updatedAt: new Date().toISOString() });
    return count;
  }

  /* ========== DETALLE PARA “MIS RESERVAS” (facade listo para UI) ========== */
  async listUserActiveReservationsDetailed(userId: string): Promise<DetailedUserReservation[]> {
    const reservations = await this.listUserActiveReservations(userId);
    if (reservations.length === 0) return [];

    const scheduleIds = [...new Set(reservations.map(r => r.scheduleId))];
    const schedules = await this.getSchedulesByIds(scheduleIds);
    const scheduleMap: Record<string, ScheduleMinimal> = {};
    schedules.forEach(s => scheduleMap[s.id] = s);

    const classIds = [...new Set(schedules.map(s => s.idClass))];
    const classes = await this.getClassesByIds(classIds);
    const classMap: Record<string, ClassModelMin> = {};
    classes.forEach(c => classMap[c.id] = c);

    const rows: DetailedUserReservation[] = reservations
      .map(r => {
        const s = scheduleMap[r.scheduleId];
        if (!s) return null;
        const startISO = s.start;
        const endISO = s.end;
        const cls = classMap[s.id] ?? classMap[s.idClass] ?? { id: s.idClass, name: 'Clase' };

        return {
          reservation: r,
          schedule: { id: s.id, idClass: s.idClass, start: startISO, end: endISO },
          class: {
            id: cls.id,
            name: cls.name,
            description: cls.description ?? '',
            imageURL: (cls as any).imageURL ?? 'assets/placeholder-class.jpg'
          },
          startLocal: this.fmtLocal(startISO),
          endLocal: this.fmtLocal(endISO),
          minutesLeft: this.minsLeft(startISO),
          canCancel: this.canCancelAt(startISO),
        };
      })
      .filter(Boolean) as DetailedUserReservation[];

    rows.sort((a, b) =>
      DateTime.fromISO(a.schedule.start, { zone: TZ }).toMillis() -
      DateTime.fromISO(b.schedule.start, { zone: TZ }).toMillis()
    );

    return rows;
  }
}
