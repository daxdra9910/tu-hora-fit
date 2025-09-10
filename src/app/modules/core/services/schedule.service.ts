import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';

import { COLLECTIONS } from '../../shared/constants/firebase.constant';
import {
  ScheduleClassModel,
  ScheduleClassModelWithId
} from '../../shared/models/schedule-class.model';
import { RecurrenceEnum } from '../../shared/enums/recurrence.enum';
import { DateTime } from 'luxon';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private readonly firestore = inject(Firestore);
  private readonly collection = COLLECTIONS.SCHEDULES;


  async createSchedule(schedule: ScheduleClassModel): Promise<void> {
    const schedules = this.generateRecurringSchedules(schedule);

    for (const sched of schedules) {
      const id = crypto.randomUUID();
      const scheduleRef = doc(this.firestore, this.collection, id);

      await setDoc(scheduleRef, {
        ...sched,
        createdAt: new Date().toISOString(),
        createdBy: 'system',
        updatedAt: new Date().toISOString(),
        updatedBy: 'system',
        active: true
      });
    }
  }

  async getAllSchedules(): Promise<ScheduleClassModelWithId[]> {
    const schedulesRef = collection(this.firestore, this.collection);
    const snapshot = await getDocs(schedulesRef);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as ScheduleClassModelWithId));
  }

  async updateSchedule(id: string, data: Partial<ScheduleClassModel>): Promise<void> {
    const scheduleRef = doc(this.firestore, this.collection, id);

    await updateDoc(scheduleRef, {
      ...data,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    });
  }

  async deleteSchedule(id: string): Promise<void> {
    const scheduleRef = doc(this.firestore, this.collection, id);
    await deleteDoc(scheduleRef);
  }

  private generateRecurringSchedules(schedule: ScheduleClassModel): ScheduleClassModel[] {
    const schedules: ScheduleClassModel[] = [];
    const recurrence = schedule.recurrence;
    const startDate = DateTime.fromISO(schedule.date);
    const endDate = DateTime.fromISO(schedule.end_recurrence ?? schedule.date);

    let currentDate = startDate;

    do {
      schedules.push({ ...schedule, date: currentDate.toISO() });

      if (recurrence === RecurrenceEnum.ONCE) break;

      if (recurrence === RecurrenceEnum.MONTHLY) {
        currentDate = currentDate.plus({ months: 1 });
      } else if (recurrence === RecurrenceEnum.WEEKLY) {
        currentDate = currentDate.plus({ weeks: 1 });
      } else if (recurrence === RecurrenceEnum.DAILY) {
        currentDate = currentDate.plus({ days: 1 });
      }
    } while (currentDate <= endDate);

    return schedules;
  }
}
