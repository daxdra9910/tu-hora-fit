import { inject, Injectable } from '@angular/core';
import { Auth, authState, confirmPasswordReset, createUserWithEmailAndPassword, sendPasswordResetEmail, signInWithEmailAndPassword, signOut, updateProfile, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$: Observable<User | null>;
  private readonly auth = inject(Auth);

  constructor() {
    this.user$ = authState(this.auth);
  }

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

  getUser(): User | null {
    return this.auth.currentUser;
  }

  updateUser(displayName: string) {
    return updateProfile(this.auth.currentUser, { displayName })
  }
}
