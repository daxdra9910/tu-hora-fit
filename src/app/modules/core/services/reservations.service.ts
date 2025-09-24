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
  date: string;         // ISO
  start: string;        // ISO
  end: string;          // ISO
  capacity: number;
  booked: number;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class ReservationService {
  private readonly firestore = inject(Firestore);
  private schedulesCol = COLLECTIONS.SCHEDULES;
  private reservationsCol = COLLECTIONS.RESERVATIONS;

  /** Reserva transaccional (sin duplicados por usuario) */
  async reserve(scheduleId: string, userId: string): Promise<{ id: string }> {
    const scheduleRef = doc(this.firestore, this.schedulesCol, scheduleId);

    // Idempotencia: si ya existe una activa, reusar
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

      // Duplicado dentro de la tx
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

  /** Cancela reserva y libera cupo (transaccional) */
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
      const s = sSnap.data() as Partial<ScheduleMinimal>;

      const booked = Number(s.booked ?? 0);

      tx.update(reservationRef, { active: false, cancelledAt: serverTimestamp() });
      tx.update(scheduleRef, {
        booked: Math.max(0, booked - 1),
        updatedAt: new Date().toISOString(),
        updatedBy: userId
      });
    });
  }

  /** Reserva activa del usuario para un schedule (si existe) */
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

  /** Lista reservas activas de un usuario */
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

  /** Lista reservas activas de un schedule */
  async listScheduleReservations(scheduleId: string) {
    const qy = query(
      collection(this.firestore, this.reservationsCol),
      where('scheduleId', '==', scheduleId),
      where('active', '==', true)
    );
    const snap = await getDocs(qy);
    return snap.docs.map(d => d.data() as ReservationModel);
  }

  /** Disponibilidad actual */
  async getAvailability(scheduleId: string) {
    const scheduleRef = doc(this.firestore, this.schedulesCol, scheduleId);
    const snap = await getDoc(scheduleRef);
    if (!snap.exists()) throw new Error('Horario no encontrado');
    const s = snap.data() as Partial<ScheduleMinimal>;
    const capacity = Number(s.capacity ?? 0);
    const booked = Number(s.booked ?? 0);
    return { capacity, booked, free: Math.max(0, capacity - booked), active: s.active !== false };
    }

  /** Admin: cancelar todas las activas de un schedule */
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
}
