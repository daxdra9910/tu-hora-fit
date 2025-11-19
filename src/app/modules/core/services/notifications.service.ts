// src/app/core/services/notifications.service.ts
import { inject, Injectable } from '@angular/core';
import {
  Firestore, collection, addDoc, serverTimestamp, query, where,
  collectionData, doc, updateDoc, arrayUnion
} from '@angular/fire/firestore';
import { Observable, combineLatest, map, catchError, of } from 'rxjs';

export interface AppNotification {
  id?: string;
  title: string;
  body: string;
  createdAt: any;
  createdBy: string;
  broadcast: boolean;
  targetUserIds?: string[];
  hiddenBy?: string[];
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly afs = inject(Firestore);
  private col = collection(this.afs, 'notifications');

  async createBroadcast(payload: { title: string; body: string; createdBy: string }) {
    const data: AppNotification = {
      ...payload,
      broadcast: true,
      targetUserIds: [],
      hiddenBy: [],
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(this.col, data);
    console.log('[notifications] created broadcast', ref.id);
  }

  async createForUsers(payload: { title: string; body: string; createdBy: string; userIds: string[] }) {
    const data: AppNotification = {
      title: payload.title,
      body: payload.body,
      createdBy: payload.createdBy,
      broadcast: false,
      targetUserIds: payload.userIds ?? [],
      hiddenBy: [],
      createdAt: serverTimestamp(),
    };
    const ref = await addDoc(this.col, data);
    console.log('[notifications] created for users', ref.id, payload.userIds);
  }

  streamForUser(userId: string): Observable<AppNotification[]> {
    const qBroadcast = query(this.col, where('broadcast', '==', true));
    const qTargeted = query(this.col, where('broadcast', '==', false), where('targetUserIds', 'array-contains', userId));

    const obsA = collectionData(qBroadcast, { idField: 'id' }) as Observable<AppNotification[]>;
    const obsB = collectionData(qTargeted, { idField: 'id' }) as Observable<AppNotification[]>;

    return combineLatest([
      obsA.pipe(catchError(e => { console.error('[notifications] broadcast read error', e); return of([] as AppNotification[]); })),
      obsB.pipe(catchError(e => { console.error('[notifications] targeted read error', e); return of([] as AppNotification[]); })),
    ]).pipe(
      map(([a, b]) => {
        const merged = [...a, ...b];
        const visible = merged.filter(n => !(n.hiddenBy ?? []).includes(userId));

        const timeValue = (n: AppNotification) => {
          const v = n.createdAt as any;
          if (!v) return 0;
          if (typeof v.toDate === 'function') return v.toDate().getTime();
          if (v.seconds) return v.seconds * 1000 + (v.nanoseconds ? Math.floor(v.nanoseconds / 1e6) : 0);
          if (v instanceof Date) return v.getTime();
          if (typeof v === 'number') return v;
          return 0;
        };

        visible.sort((x, y) => timeValue(y) - timeValue(x));
        return visible;
      })
    );
  }

  async hideForUser(notificationId: string, userId: string) {
    const ref = doc(this.afs, `notifications/${notificationId}`);
    await updateDoc(ref, { hiddenBy: arrayUnion(userId) });
    console.log('[notifications] hideForUser', notificationId, userId);
  }
}
