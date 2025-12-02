// 📄 environments/environment.prod.ts
export const environment = {
  production: true,
  firebaseConfig: {
    apiKey: "AIzaSyBypIWdaSu84VbZmVTEJ25rDmMhnJz1wwY",
    authDomain: "tu-hora-fit.firebaseapp.com",
    projectId: "tu-hora-fit",
    storageBucket: "tu-hora-fit.firebasestorage.app",
    messagingSenderId: "774141056560",
    appId: "1:774141056560:web:3d94601a3f1be42f3bfff5"
  },
  reservation: {
    PLAN_DURATION_DAYS: 30,
    CANCELLATION_WINDOW_MIN: 60,
    DEFAULT_CREDIT_COST: 1,
    ACTIVATION_POLICY: 'purchase'
  },
  // ✅ AGREGAR WOMPI EN PRODUCCIÓN
  wompi: {
    publicKey: 'pub_test_Zg6ilWlSrUwDQ7z0sJqsmQwzr8j47d4D',
    privateKey: 'prv_test_EElVgf2COjdbY5ocqgvyjzgQiCyj1Mgc',
    webhookSecret: 'TEMPORAL',
    baseUrl: 'https://sandbox.wompi.co/v1', // Para proyecto universitario
    currency: 'COP'
  },
  geminiApiKey: 'AIzaSyAgVy1TcmHqOubjyS7_CHMt5V0gPPr4apg'
};