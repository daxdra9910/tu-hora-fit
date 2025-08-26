import { inject, Injectable } from '@angular/core';
import { collection, doc, Firestore, getDocs, setDoc } from '@angular/fire/firestore';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';
import { ScheduleClassModel, ScheduleClassModelWithId } from '../../shared/models/schedule-class.model';
import { RecurrenceEnum } from '../../shared/enums/recurrence.enum';
import { DateTime } from 'luxon';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private readonly firestore = inject(Firestore);
  private readonly collection = COLLECTIONS.SCHEDULES;

  async createSchedule(schedule: ScheduleClassModel) {
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

  async getAllSchedules() {
    const schedulesRef = collection(this.firestore, this.collection);
    const snapshot = await getDocs(schedulesRef);

    return snapshot.docs.map(doc => {
      return {
        ...doc.data(),
        id: doc.id
      } as ScheduleClassModelWithId;
    });
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

  updateSchedule() {}

  deleteSchedule() {}
}
