import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { from, map, switchMap, take } from 'rxjs';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';
import { UserModel } from '../../shared/models/user.model';
import { RoleEnum } from '../../shared/enums/role.enum';

export function roleGuard(allowedRoles: RoleEnum[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const firestore = inject(Firestore);

    return authService.authState$.pipe(
      take(1),
      switchMap((firebaseUser) => {
        if (!firebaseUser) {
          return from([router.createUrlTree(['/auth/login'])]);
        }

        const userRef = doc(firestore, COLLECTIONS.USERS, firebaseUser.uid);
        return from(getDoc(userRef)).pipe(
          map((userSnap) => {
            const userData = userSnap.data() as UserModel;

            if (!userData?.role || !allowedRoles.includes(userData.role)) {
              return router.createUrlTree(['/unauthorized']);
            }

            return true;
          })
        );
      })
    );
  };
}
