import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonIcon,
  IonAvatar
} from '@ionic/angular/standalone';

import { NotificationsService } from '../../../core/services/notifications.service';
import { NotificationModel } from '../../../shared/models/notification.model';
import { Auth } from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { trashOutline, megaphoneOutline } from 'ionicons/icons';

@Component({
  selector: 'app-my-notifications',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel,
    IonItemSliding, IonItemOptions, IonItemOption, IonIcon, IonAvatar
  ],
  templateUrl: './my-notifications.component.html',
  styleUrls: ['./my-notifications.component.scss']
})
export class MyNotificationsComponent implements OnInit, OnDestroy {
  private readonly notifications = inject<NotificationsService>(NotificationsService);
  private readonly auth = inject<Auth>(Auth);

  private sub?: Subscription;

  userId = '';
  items: NotificationModel[] = [];

  constructor() {
    addIcons({ trashOutline, megaphoneOutline });
  }

  ngOnInit(): void {
    this.userId = this.auth.currentUser?.uid ?? '';
    this.sub = this.notifications.streamForUser(this.userId)
      .subscribe(list => {
        this.items = (list || []).map((r: any) => {
          const rawDate = r.createdAt ?? r.date ?? null;
          let date: Date | null = null;

          if (rawDate) {
            if (typeof rawDate.toDate === 'function') {
              date = rawDate.toDate();
            } else if (rawDate instanceof Date) {
              date = rawDate;
            } else if (typeof rawDate === 'number') {
              date = new Date(rawDate);
            } else if ((rawDate as any).seconds) {
              const s = (rawDate as any).seconds as number;
              const ns = (rawDate as any).nanoseconds ?? 0;
              date = new Date(s * 1000 + Math.floor(ns / 1e6));
            }
          }

          return {
            id: r.id,
            title: r.title ?? '',
            message: r.body ?? r.message ?? '',
            // sentBy intentionally NOT included (do not expose UID to clients)
            date,
            broadcast: r.broadcast ?? false,
            targetUserIds: r.targetUserIds ?? [],
            hiddenBy: r.hiddenBy ?? []
          } as NotificationModel;
        });
      });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async remove(n: NotificationModel, sliding?: IonItemSliding) {
    if (!n?.id) return;
    try {
      await this.notifications.hideForUser(n.id, this.userId);
    } catch (err) {
      console.error('Error ocultando notificación', err);
    } finally {
      try { await (sliding as any)?.close?.(); } catch { /* noop */ }
    }
  }
}
