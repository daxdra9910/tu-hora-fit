// src/app/core/services/reservation.service.ts
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

    const parsed = timeStr?.includes?.('M')
      ? DateTime.fromFormat(timeStr, 'h:mm a', { zone: TZ, locale: LOCALE })
      : DateTime.fromFormat(timeStr ?? '', 'HH:mm', { zone: TZ, locale: LOCALE });

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
    schedules.forEach(s => (scheduleMap[s.id] = s));

    const classIds = [...new Set(schedules.map(s => s.idClass))];
    const classes = await this.getClassesByIds(classIds);
    const classMap: Record<string, ClassModelMin> = {};
    classes.forEach(c => (classMap[c.id] = c));

    const rows: DetailedUserReservation[] = reservations
      .map(r => {
        const s = scheduleMap[r.scheduleId];
        if (!s) return null;
        const startISO = s.start;
        const endISO = s.end;

        // ✅ Mapeo correcto por idClass (antes s.id)
        const cls = classMap[s.idClass] ?? { id: s.idClass, name: 'Clase' };

        return {
          reservation: r,
          schedule: { id: s.id, idClass: s.idClass, start: startISO, end: endISO },
          class: {
            id: cls.id,
            name: cls.name || 'Clase',
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

  /* ==================== ADMIN: DETALLE POR SCHEDULE ==================== */

  /** Normaliza doc de reserva: acepta alias y captura snapshot de usuario */
  private normalizeReservationDoc(d: any) {
    const id = d.id;

    // 🔑 userId: soporta muchísimos alias/nidos
    const userId =
      d.userId ?? d.user_id ?? d.uid ??
      d.userUID ?? d.user_uid ??
      d.user?.uid ?? d.customer?.uid ?? d.customer_uid;

    // 🔑 scheduleId: soporta muchos alias
    const scheduleId =
      d.scheduleId ?? d.schedule_id ?? d.schedule_class_id ??
      d.class_schedule_id ?? d.reservation_schedule_id;

    // Estado operativo
    const active =
      typeof d.active === 'boolean' ? d.active : (d.cancelledAt ? false : true);

    // Histórico: cancelada si hay cualquiera de estos indicios
    const statusStr = String(d.status || '').toLowerCase();
    const isCancelled =
      !!d.cancelledAt ||
      d.cancelled === true ||
      d.isCancelled === true ||
      statusStr === 'cancelled' || statusStr === 'canceled';

    // 🔎 Snapshots posibles del usuario guardados en la reserva
    const snapEmail =
      d.email ?? d.userEmail ?? d.user_email ?? d.user?.email ?? d.customer?.email;

    const snapName =
      d.displayName ?? d.name ?? d.fullName ?? d.userName ?? d.user_name ??
      d.user?.displayName ?? d.user?.name ?? d.customer?.name;

    return {
      id,
      userId,
      scheduleId,
      active,
      createdAt: d.createdAt,
      cancelledAt: d.cancelledAt,
      isCancelled,
      // snapshots para fallback en UI si no existe el doc del usuario
      snapEmail,
      snapName,
    };
  }

  /**
   * Busca usuarios:
   *  1) por docId (__name__)
   *  2) por campo uid
   */
  private async getUsersByIdsOrUid(uids: string[]) {
    if (!uids?.length) return [];
    const unique = Array.from(new Set(uids.filter(Boolean)));

    const chunk = <T,>(arr: T[], size = 10) =>
      Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

    const usersCol = collection(this.firestore, COLLECTIONS.USERS);

    // 1) docId
    const foundByDoc = new Map<string, { uid: string; email?: string; displayName?: string }>();
    for (const part of chunk(unique, 10)) {
      const qDoc = query(usersCol, where('__name__', 'in', part));
      const snap = await getDocs(qDoc);
      snap.forEach(d => {
        const data = d.data() as any;
        foundByDoc.set(d.id, {
          uid: d.id,
          email: data.email,
          displayName: data.displayName ?? data.name ?? '',
        });
      });
    }

    // 2) uid
    const missing = unique.filter(id => !foundByDoc.has(id));
    const foundByUid = new Map<string, { uid: string; email?: string; displayName?: string }>();
    for (const part of chunk(missing, 10)) {
      if (part.length === 0) continue;
      try {
        const qUid = query(usersCol, where('uid', 'in', part));
        const snap = await getDocs(qUid);
        snap.forEach(d => {
          const data = d.data() as any;
          const realUid = data.uid ?? d.id;
          foundByUid.set(realUid, {
            uid: realUid,
            email: data.email,
            displayName: data.displayName ?? data.name ?? '',
          });
        });
      } catch {
        /* ignore index/limit */
      }
    }

    // Merge
    const out: Array<{ uid: string; email?: string; displayName?: string }> = [];
    for (const id of unique) {
      const a = foundByDoc.get(id);
      const b = foundByUid.get(id);
      if (a) out.push(a);
      else if (b) out.push(b);
    }
    return out;
  }

  /**
   * Admin: Métricas robustas (confirmadas/canceladas) + listado enriquecido.
   * - Métricas cuentan TODO (incluye 'system') para no perder histórico.
   * - Listado excluye 'system' (solo personas reales) y usa Fallback por snapshot.
   */
  async listScheduleReservationsWithUsers(scheduleId: string): Promise<{
    reservasActivas: number;   // confirmadas (no canceladas), incluye 'system' en el conteo
    cancelaciones: number;
    listado: Array<{
      name: string;
      email?: string;
      status: 'Activa' | 'Cancelada';
      userId?: string;
      createdAt?: any;
      cancelledAt?: any;
    }>;
  }> {
    const col = collection(this.firestore, this.reservationsCol);

    // Soporta alias scheduleId (múltiples queries; Firestore no soporta OR)
    const q1 = query(col, where('scheduleId', '==', scheduleId));
    const q2 = query(col, where('schedule_id', '==', scheduleId));
    const q3 = query(col, where('schedule_class_id', '==', scheduleId));
    const q4 = query(col, where('class_schedule_id', '==', scheduleId));

    const [s1, s2, s3, s4] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4)]);
    // De-duplicar por doc.id
    const seen = new Set<string>();
    const docs = [...s1.docs, ...s2.docs, ...s3.docs, ...s4.docs].filter(d => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });

    if (docs.length === 0) {
      return { reservasActivas: 0, cancelaciones: 0, listado: [] };
    }

    // Normaliza TODAS (incluye 'system' para métricas)
    const rowsAll = docs.map(d => this.normalizeReservationDoc({ id: d.id, ...(d.data() as any) }));

    // Métricas históricas
    const cancelacionesAll = rowsAll.filter(r => r.isCancelled).length;
    const reservasConfirmadasAll = rowsAll.length - cancelacionesAll;

    // ---- Listado: usuarios reales ----
    const rowsForList = rowsAll.filter(r => r.userId && r.userId !== 'system');

    if (rowsForList.length === 0) {
      return { reservasActivas: reservasConfirmadasAll, cancelaciones: cancelacionesAll, listado: [] };
    }

    // Cargar usuarios
    const userIds = rowsForList.map(r => r.userId) as string[];
    const users = await this.getUsersByIdsOrUid(userIds);
    const userMap = new Map(users.map(u => [u.uid, u]));

    // Enriquecer con fallback por snapshot cuando no hay user doc
    const enriched = rowsForList.map(r => {
      const u = userMap.get(r.userId);
      const email = u?.email ?? r.snapEmail ?? undefined;
      const name =
        (u?.displayName?.trim?.() ? u.displayName : null) ??
        (r.snapName?.trim?.() ? r.snapName : null) ??
        (email?.split('@')?.[0] ?? r.userId ?? 'Usuario');

      const status: 'Activa' | 'Cancelada' = r.isCancelled ? 'Cancelada' : 'Activa';

      return {
        name,
        email,
        status,
        userId: r.userId,
        createdAt: r.createdAt,
        cancelledAt: r.cancelledAt,
      };
    });

    // 🔧 Normalizador de fechas a milis (soporta Timestamp, Date e ISO)
    const toMillis = (t: any) => {
      if (!t) return 0;
      if (typeof t?.toMillis === 'function') return t.toMillis();
      if (typeof t?.toDate === 'function') return t.toDate().getTime();
      if (t instanceof Date) return t.getTime();
      const iso = String(t);
      const dt = DateTime.fromISO(iso);
      return dt.isValid ? dt.toMillis() : 0;
    };

    // Orden: confirmadas (createdAt desc) -> canceladas (cancelledAt desc)
    const listado = enriched.sort((a, b) => {
      const aCanc = a.status === 'Cancelada';
      const bCanc = b.status === 'Cancelada';
      if (aCanc !== bCanc) return aCanc ? 1 : -1; // Activas primero
      const ta = aCanc ? toMillis(a.cancelledAt) : toMillis(a.createdAt);
      const tb = bCanc ? toMillis(b.cancelledAt) : toMillis(b.createdAt);
      return tb - ta;
    });

    return { reservasActivas: reservasConfirmadasAll, cancelaciones: cancelacionesAll, listado };
  }

  // 🔎 Utilidad opcional de depuración (puedes quitarla luego)
  async debugScheduleReservations(scheduleId: string) {
    const res = await this.listScheduleReservationsWithUsers(scheduleId);
    console.table(res.listado.map(x => ({
      name: x.name, email: x.email, status: x.status,
      createdAt: typeof x.createdAt?.toDate === 'function' ? x.createdAt.toDate() : x.createdAt,
      cancelledAt: typeof x.cancelledAt?.toDate === 'function' ? x.cancelledAt.toDate() : x.cancelledAt,
    })));
    return res;
  }
}
