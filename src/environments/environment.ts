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

  wompi: {
    publicKey: 'pub_test_Zg61IMJ5rUhDQ72BsJqsmQwzr8j47d4D',
    privateKey: 'prv_test_EEIVgf2C0jdbV5ocqgyyjzgQiCyj1Mgc',
    baseUrl: 'https://sandbox.wompi.co/v1',
    currency: 'COP',
    acceptanceToken: 'eyJhbGciOiJIUzI1NiJ9.eyJjb250cmFjdF9pZCI6MSwicGVybWFsaW5rIjoiaHR0cHM6Ly93b21waS5jby93cC1jb250ZW50L3VwbG9hZHMvMjAxOS8wOS9URVJNSU5PUy1ZLUNPTkRJQ0lPTkVTLURFLVVTTy1ERVAtV09NUEkuUERGIn0.lSmnkljbeycOeu2c1n-uhyfc2P7pe8JYMiXl-cYiD0M'
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
