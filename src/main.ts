import { LogLevel, setLogLevel } from "@angular/fire";
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, provideRouter, RouteReuseStrategy, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

import {
  addOutline,
  alertCircleOutline,
  barbellOutline,
  barChartOutline,
  calendarOutline,
  cardOutline,
  cashOutline,
  checkmarkCircle,
  checkmarkOutline,
  close,
  eyeOutline,
  homeOutline,
  idCardOutline,
  logOutOutline,
  menuOutline,
  pencilOutline,
  peopleOutline,
  personOutline,
  timeOutline,
  trashOutline,
  chatbubblesOutline,
  // 👇 NUEVO: ícono para “Reservas”
  ticketOutline,
  // listOutline, // ← alternativa si tu versión no tiene “ticket-outline”
} from 'ionicons/icons';

addIcons({
  'add-outline': addOutline,
  'alert-circle-outline': alertCircleOutline,
  'barbell-outline': barbellOutline,
  'bar-chart-outline': barChartOutline,
  'calendar-outline': calendarOutline,
  'card-outline': cardOutline,
  'cash-outline': cashOutline,
  'close': close,
  'checkmark-circle': checkmarkCircle,
  'checkmark-outline': checkmarkOutline,
  'eye-outline': eyeOutline,
  'home-outline': homeOutline,
  'id-card-outline': idCardOutline,
  'log-out-outline': logOutOutline,
  'menu-outline': menuOutline,
  'pencil-outline': pencilOutline,
  'people-outline': peopleOutline,
  'person-outline': personOutline,
  'time-outline': timeOutline,
  'trash-outline': trashOutline,
  'chatbubbles-outline': chatbubblesOutline,
  // 👇 NUEVO: Registro del ícono de Reservas
  'ticket-outline': ticketOutline,
  // 'list-outline': listOutline, // ← usa este si el anterior no existe
});

setLogLevel(LogLevel.SILENT);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideHttpClient()
  ],
});
