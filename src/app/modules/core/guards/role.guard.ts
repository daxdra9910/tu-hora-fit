// src/app/modules/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { from, map, of, switchMap, take } from 'rxjs';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';
import { UserModel } from '../../shared/models/user.model';
import { RoleEnum } from '../../shared/enums/role.enum';

export const roleGuard: (allowedRoles: RoleEnum[]) => CanActivateFn = (allowedRoles) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const firestore = inject(Firestore);

    return authService.authState$.pipe(
      take(1),
      switchMap((firebaseUser) => {
        if (!firebaseUser) {
          return of(router.createUrlTree(['/auth/login']));
        }

        const userRef = doc(firestore, COLLECTIONS.USERS, firebaseUser.uid);
        return from(getDoc(userRef)).pipe(
          map((userSnap) => {
            const userData = (userSnap.exists() ? userSnap.data() : undefined) as UserModel | undefined;

            // 1) Rol proveniente de BD (si existe)
            const dbRole = userData?.role as RoleEnum | undefined;

            // 2) Rol de demo/LocalStorage (AuthService)
            const demoRole = authService.currentRole; // 'admin' | 'client'

            // 3) Rol efectivo: BD > demo
            const effective: RoleEnum =
              dbRole ?? (demoRole === 'admin' ? RoleEnum.ADMIN : RoleEnum.CLIENT);

            // 🔄 4) Sincroniza SIEMPRE el AuthService para que el menú refleje el rol
            authService.setRole(effective === RoleEnum.ADMIN ? 'admin' : 'client');

            // 5) Verificación de permisos
            if (allowedRoles.includes(effective)) {
              return true;
            }

            // 6) Redirección a una zona segura según el rol actual
            const safe = effective === RoleEnum.ADMIN ? '/admin' : '/reservations';
            return router.createUrlTree([safe]);
          })
        );
      })
    );
  };
};
