import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  collection,
  runTransaction,
  serverTimestamp,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  writeBatch
} from '@angular/fire/firestore';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';

/**
 * Estructuras base (ajusta si tus modelos difieren)
 */
export interface ReservationModel {
  id: string;              // doc id
  scheduleId: string;      // ref a SCHEDULES
  userId: string;          // ref a USERS (o UID de auth)
  createdAt: any;          // serverTimestamp
  cancelledAt?: any;       // serverTimestamp
  active: boolean;         // true = vigente, false = cancelada
}

export interface ScheduleMinimal {
  id: string;
  idClass: string;
  date: string;            // ISO
  start: string;           // ISO
  end: string;             // ISO
  capacity: number;        // total cupos
  booked: number;          // cupos tomados
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly firestore = inject(Firestore);

  private schedulesCol = COLLECTIONS.SCHEDULES;     // e.g. 'schedules'
  private reservationsCol = COLLECTIONS.RESERVATIONS; // e.g. 'reservations'

  /**
   * Crea una reserva de forma transaccional, evitando sobrecupo y duplicados por usuario.
   * @throws Error con mensaje de usuario si no hay cupos o ya existe reserva.
   */
  async reserve(scheduleId: string, userId: string): Promise<{ id: string }>{
    const scheduleRef = doc(this.firestore, this.schedulesCol, scheduleId);

    // Duplicado por usuario (idempotencia): si ya tiene una activa, devolvemos esa.
    const existing = await this.findActiveReservationByUser(scheduleId, userId);
    if (existing) return { id: existing.id };

    const reservationId = crypto.randomUUID();
    const reservationRef = doc(this.firestore, this.reservationsCol, reservationId);

    await runTransaction(this.firestore, async (tx) => {
      const schedSnap = await tx.get(scheduleRef);
      if (!schedSnap.exists()) throw new Error('El horario no existe.');
      const s = schedSnap.data() as Partial<ScheduleMinimal>;
      if (s.active === false) throw new Error('Este horario no está activo.');

      const capacity = Number(s.capacity ?? 0);
      const booked = Number(s.booked ?? 0);
      if (booked >= capacity) throw new Error('No hay cupos disponibles.');

      // Rechequea duplicado dentro de la transacción
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
      } satisfies Partial<ReservationModel>);
    });

    return { id: reservationId };
  }

  /**
   * Cancela una reserva activa y libera cupo (transaccional).
   * Verifica que la reserva corresponda al usuario a menos que bypassUserCheck sea true.
   */
  async cancel(reservationId: string, userId: string, bypassUserCheck = false): Promise<void> {
    const reservationRef = doc(this.firestore, this.reservationsCol, reservationId);

    await runTransaction(this.firestore, async (tx) => {
      const rSnap = await tx.get(reservationRef);
      if (!rSnap.exists()) throw new Error('La reserva no existe.');
      const r = rSnap.data() as ReservationModel;
      if (!r.active) return; // ya cancelada → idempotente
      if (!bypassUserCheck && r.userId !== userId) throw new Error('No puedes cancelar esta reserva.');

      const scheduleRef = doc(this.firestore, this.schedulesCol, r.scheduleId);
      const sSnap = await tx.get(scheduleRef);
      if (!sSnap.exists()) throw new Error('El horario de la reserva no existe.');
      const s = sSnap.data() as Partial<ScheduleMinimal>;

      const booked = Number(s.booked ?? 0);

      tx.update(reservationRef, { active: false, cancelledAt: serverTimestamp() });
      tx.update(scheduleRef, { booked: Math.max(0, booked - 1), updatedAt: new Date().toISOString(), updatedBy: userId });
    });
  }

  /**
   * Obtiene la reserva activa del usuario para un schedule (si existe).
   */
  async findActiveReservationByUser(scheduleId: string, userId: string): Promise<ReservationModel | null> {
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

  /**
   * Lista las reservas activas de un usuario, ordenadas por creación.
   */
  async listUserActiveReservations(userId: string, top = 50): Promise<ReservationModel[]> {
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

  /**
   * Lista reservas (activas) de un schedule.
   */
  async listScheduleReservations(scheduleId: string): Promise<ReservationModel[]> {
    const qy = query(
      collection(this.firestore, this.reservationsCol),
      where('scheduleId', '==', scheduleId),
      where('active', '==', true)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => d.data() as ReservationModel);
  }

  /**
   * Verifica disponibilidad actual de un schedule.
   */
  async getAvailability(scheduleId: string): Promise<{ capacity: number; booked: number; free: number; active: boolean }>{
    const scheduleRef = doc(this.firestore, this.schedulesCol, scheduleId);
    const snap = await getDoc(scheduleRef);
    if (!snap.exists()) throw new Error('Horario no encontrado');
    const s = snap.data() as Partial<ScheduleMinimal>;
    const capacity = Number(s.capacity ?? 0);
    const booked = Number(s.booked ?? 0);
    return { capacity, booked, free: Math.max(0, capacity - booked), active: s.active !== false };
  }

  /**
   * Limpieza masiva: cancelar todas las reservas activas de un schedule (admin).
   */
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

    // opcional: resetear booked en schedule a 0 (o recalcular)
    const scheduleRef = doc(this.firestore, this.schedulesCol, scheduleId);
    await updateDoc(scheduleRef, { booked: 0, updatedAt: new Date().toISOString() });
    return count;
  }
}

/**
 * === Notas de implementación ===
 * 1) Índices recomendados en Firestore:
 *    - reservations: [scheduleId ASC, active ASC]
 *    - reservations: [userId ASC, active ASC, createdAt DESC]
 * 2) Para consultas por día/hora en schedules, guarda también `dateEpoch` (ms) al crear el schedule.
 * 3) Idempotencia: `reserve` previene duplicados por usuario.
 * 4) Seguridad: refuerza reglas de Firestore para permitir reservar/cancelar sólo al propio user o a roles admin.
 */
