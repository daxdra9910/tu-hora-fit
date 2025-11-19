import { LogLevel, setLogLevel } from '@angular/fire';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  PreloadAllModules,
  provideRouter,
  RouteReuseStrategy,
  withPreloading,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient } from '@angular/common/http';
import { addIcons } from 'ionicons';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';

// 🔹 Importamos todos los íconos necesarios
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
  ticketOutline, // Reservas
  // 👇 NUEVOS: notificaciones
  notificationsOutline,
  megaphoneOutline,
  flashOutline,
  // 👇 NUEVOS ICONOS PARA EL PERFIL Y MENÚ
  personCircleOutline,
  calendarNumberOutline,
  callOutline,
  mailOutline,
  starOutline,
  logOutOutline as logOut
} from 'ionicons/icons';

// 🔹 Registramos todos los íconos
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
  'ticket-outline': ticketOutline,
  'flash-outline': flashOutline,

  // 🔹 NUEVOS ICONOS PARA NOTIFICACIONES
  'notifications-outline': notificationsOutline,
  'megaphone-outline': megaphoneOutline,

  // 🔹 NUEVOS ICONOS PARA EL PERFIL Y MENÚ
  'person-circle-outline': personCircleOutline,
  'calendar-number-outline': calendarNumberOutline,
  'call-outline': callOutline,
  'mail-outline': mailOutline,
  'star-outline': starOutline,
  'pencil': pencilOutline,
});

// 🔹 Configuración del log
setLogLevel(LogLevel.SILENT);

// 🔹 Bootstrap principal
bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({ mode: 'md' }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideHttpClient(),
  ],
});
