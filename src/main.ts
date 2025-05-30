import { LogLevel, setLogLevel } from "@angular/fire";
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { bootstrapApplication } from '@angular/platform-browser';
import { PreloadAllModules, provideRouter, RouteReuseStrategy, withPreloading } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';

import { getStorage, provideStorage } from '@angular/fire/storage';
import { addIcons } from 'ionicons';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { environment } from './environments/environment';


import {
  addOutline,
  alertCircleOutline,
  barbellOutline,
  calendarOutline, checkmarkCircle,
  close,
  eyeOutline,
  homeOutline,
  idCardOutline,
  logOutOutline,
  menuOutline,
  pencilOutline,
  peopleOutline,
  personOutline,
  timerOutline,
  trashOutline
} from 'ionicons/icons';

addIcons({
  'add-outline': addOutline,
  'alert-circle-outline': alertCircleOutline,
  'barbell-outline': barbellOutline,
  'calendar-outline': calendarOutline,
  'close': close,
  'checkmark-circle': checkmarkCircle,
  'eye-outline': eyeOutline,
  'home-outline': homeOutline,
  'id-card-outline': idCardOutline,
  'log-out-outline': logOutOutline,
  'menu-outline': menuOutline,
  'pencil-outline': pencilOutline,
  'people-outline': peopleOutline,
  'person-outline': personOutline,
  'time-outline': timerOutline,
  'trash-outline': trashOutline,
})

setLogLevel(LogLevel.SILENT);

bootstrapApplication(AppComponent, {
  providers: [
    {provide: RouteReuseStrategy, useClass: IonicRouteStrategy},
    provideIonicAngular({mode: 'md'}),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ],
});
