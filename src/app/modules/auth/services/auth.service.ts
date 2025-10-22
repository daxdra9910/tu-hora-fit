import { inject, Injectable } from '@angular/core';
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
import { BehaviorSubject, Observable, from, of, switchMap } from 'rxjs';
import { Firestore, doc, docData } from '@angular/fire/firestore';

import { RoleEnum } from '../../shared/enums/role.enum';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';
import { UserModel } from '../../shared/models/user.model';

export type Role = 'admin' | 'client';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly firestore = inject(Firestore);

  private readonly LS_KEY = 'demo_role';
  private readonly role$ = new BehaviorSubject<Role>(
    (localStorage.getItem(this.LS_KEY) as Role) || 'client'
  );

  constructor() {
    // 🔄 Sincroniza rol en cada login/reload y escucha cambios en vivo del doc
    authState(this.auth)
      .pipe(
        switchMap((firebaseUser) => {
          if (!firebaseUser) {
            this.setRole('client');
            return of(null);
          }
          const ref = doc(this.firestore, COLLECTIONS.USERS, firebaseUser.uid);
          // docData => se actualiza solo si cambias el rol en Firestore (tiempo real)
          return docData(ref) as unknown as Observable<UserModel | null>;
        })
      )
      .subscribe((data) => {
        if (!data) return;

        // Normaliza (tolera enum numérico, string, etc.)
        const raw = data.role;
        const s = String(raw ?? '').toLowerCase();

        const isAdmin =
          s === 'admin' ||
          s === String(RoleEnum.ADMIN).toLowerCase() ||
          raw === RoleEnum.ADMIN;

        this.setRole(isAdmin ? 'admin' : 'client');
      });
  }

  setRole(role: Role) {
    localStorage.setItem(this.LS_KEY, role);
    this.role$.next(role);
  }
  get currentRole$(): Observable<Role> { return this.role$.asObservable(); }
  get currentRole(): Role { return this.role$.value; }
  hasRole(role: Role) { return this.currentRole === role; }
  hasAnyRole(roles: Role[]) { return roles.includes(this.currentRole); }

  // ====== Autenticación original ======
  singIn(email: string, password: string) { return signInWithEmailAndPassword(this.auth, email, password); }
  singUp(email: string, password: string) { return createUserWithEmailAndPassword(this.auth, email, password); }
  logout() { return signOut(this.auth); }
  forgotPassword(email: string) { return sendPasswordResetEmail(this.auth, email); }
  resetPassword(oobCode: string, newPassword: string) { return confirmPasswordReset(this.auth, oobCode, newPassword); }
  get authState$(): Observable<User | null> { return authState(this.auth); }
  updateUser(displayName: string) { return updateProfile(this.auth.currentUser, { displayName }); }
}
