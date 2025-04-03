import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, User } from '@angular/fire/auth';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUser = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUser.asObservable();

  constructor(
    private readonly auth: Auth
  ) {}

  singIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }
  
  singUp(email: string, password: string) {
    return createUserWithEmailAndPassword(this.auth, email, password);
  }

  logout() {
    return signOut(this.auth);
  }

  getUser(): User | null {
    return this.auth.currentUser;
  }

  updateUser(displayName: string) {
    return updateProfile(this.auth.currentUser, { displayName })
  }
}
