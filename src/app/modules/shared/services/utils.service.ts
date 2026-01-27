import {Injectable} from '@angular/core';
import {LoadingController, ToastController, ToastOptions} from '@ionic/angular'

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  constructor(
    private readonly loadingCtrl: LoadingController,
    private readonly toastCtrl: ToastController,
  ) {
  }

  loading() {
    return this.loadingCtrl.create({spinner: 'crescent'});
  }

  async presentToast(opts?: ToastOptions) {
    const toast = await this.toastCtrl.create(opts);
    await toast.present();
  }

  getFirebaseAuthErrorMessage(code?: string): string {
  switch (code) {

    // LOGIN
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos';

    // REGISTRO
    case 'auth/email-already-in-use':
      return 'Este correo ya está registrado';

    case 'auth/invalid-email':
      return 'El correo electrónico no es válido';

    case 'auth/weak-password':
      return 'La contraseña es demasiado débil';

    case 'auth/too-many-requests':
      return 'Demasiados intentos. Intenta más tarde';

    case 'auth/user-disabled':
      return 'Esta cuenta ha sido deshabilitada';

    default:
      return 'Ocurrió un error. Intenta nuevamente';
  }
}



}
