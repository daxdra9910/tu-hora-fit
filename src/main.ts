import {bootstrapApplication} from '@angular/platform-browser';
import {PreloadAllModules, provideRouter, RouteReuseStrategy, withPreloading} from '@angular/router';
import {IonicRouteStrategy, provideIonicAngular} from '@ionic/angular/standalone';
import {initializeApp, provideFirebaseApp} from '@angular/fire/app';
import {getAuth, provideAuth} from '@angular/fire/auth';
import {getFirestore, provideFirestore} from '@angular/fire/firestore';
import {setLogLevel, LogLevel} from "@angular/fire";

import {routes} from './app/app.routes';
import {AppComponent} from './app/app.component';
import {environment} from './environments/environment';
import {addIcons} from 'ionicons';
import { getStorage, provideStorage } from '@angular/fire/storage';


import {
  addOutline,
  alertCircleOutline,
  calendarOutline, checkmarkCircle,
  close,
  eyeOutline,
  homeOutline,
  idCardOutline,
  menuOutline,
  pencilOutline,
  personOutline,
  trashOutline
} from 'ionicons/icons'

addIcons({
  'alert-circle-outline': alertCircleOutline,
  'person-outline': personOutline,
  'menu-outline': menuOutline,
  'home-outline': homeOutline,
  'calendar-outline': calendarOutline,
  'id-card-outline': idCardOutline,
  'add-outline': addOutline,
  'eye-outline': eyeOutline,
  'pencil-outline': pencilOutline,
  'trash-outline': trashOutline,
  'close': close,
  'checkmark-circle': checkmarkCircle
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
