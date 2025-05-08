import {inject, Injectable} from '@angular/core';
import {
  Auth,
  authState,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User
} from '@angular/fire/auth';
import {Observable} from 'rxjs';
import {UserModel} from "../../shared/models/user.model";
import {Firestore} from "@angular/fire/firestore";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  singIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  singUp(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  forgotPassword(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }

  resetPassword(oobCode: string, newPassword: string) {
    return confirmPasswordReset(this.auth, oobCode, newPassword);
  }

  get authState$(): Observable<User | null> {
    return authState(this.auth);
  }

  updateUser(displayName: string) {
    return updateProfile(this.auth.currentUser, {displayName})
  }
}
