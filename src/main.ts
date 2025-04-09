import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { addIcons } from 'ionicons';

import {
  addOutline,
  alertCircleOutline,
  calendarOutline,
  chevronBackOutline, eyeOutline,
  homeOutline,
  idCardOutline,
  menuOutline, pencilOutline,
  personOutline, trashOutline
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
  'trash-outline': trashOutline
})

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({mode: 'md'}),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
  ],
});
