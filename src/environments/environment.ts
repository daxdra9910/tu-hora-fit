// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebaseConfig: {
    apiKey: "AIzaSyBypIWdaSu84VbZmVTEJ25rDmMhnJz1wwY",
    authDomain: "tu-hora-fit.firebaseapp.com",
    projectId: "tu-hora-fit",
    storageBucket: "tu-hora-fit.firebasestorage.app",
    messagingSenderId: "774141056560",
    appId: "1:774141056560:web:3d94601a3f1be42f3bfff5"
  },

  // Estándares globales de reservas
  reservation: {
    PLAN_DURATION_DAYS: 30,          // vigencia del plan
    CANCELLATION_WINDOW_MIN: 60,     // 1 hora antes de la clase
    DEFAULT_CREDIT_COST: 1,          // costo por clase si no se define
    ACTIVATION_POLICY: 'purchase' as 'purchase' | 'first_use',
  },

  // de develop
  geminiApiKey: 'AIzaSyAgVy1TcmHqOubjyS7_CHMt5V0gPPr4apg'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
