// src/app/modules/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { from, map, of, switchMap, take, catchError } from 'rxjs';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';
import { UserModel } from '../../shared/models/user.model';
import { RoleEnum } from '../../shared/enums/role.enum';

// Activa logs para ver valores
const DEBUG = true;
const log = (where: string, data?: any) => { if (DEBUG) console.log(`[roleGuard:${where}]`, data ?? ''); };

// ✅ Normaliza cualquier valor a RoleEnum
const toEnum = (val: any): RoleEnum | undefined => {
  if (val == null) return undefined;
  const s = String(val).trim().toUpperCase();
  if (s === 'ADMIN') return RoleEnum.ADMIN;
  if (s === 'CLIENT') return RoleEnum.CLIENT;
  return undefined;
};

export const roleGuard: (allowed: RoleEnum[]) => CanActivateFn = (allowed) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const firestore = inject(Firestore);

    return authService.authState$.pipe(
      take(1),
      switchMap((firebaseUser) => {
        if (!firebaseUser) {
          log('noUser -> /auth/login');
          return of(router.createUrlTree(['/auth/login']));
        }

        const userRef = doc(firestore, COLLECTIONS.USERS, firebaseUser.uid);
        return from(getDoc(userRef)).pipe(
          map((userSnap) => {
            const userData = (userSnap.exists() ? userSnap.data() : undefined) as UserModel | undefined;

            // 1) Normaliza TODO a RoleEnum
            const dbRoleEnum   = toEnum(userData?.role);
            const demoRoleEnum = toEnum((authService as any).currentRole); // 'admin' | 'client'

            // 2) Rol efectivo SIEMPRE como RoleEnum
            const effective: RoleEnum = dbRoleEnum ?? demoRoleEnum ?? RoleEnum.CLIENT;

            // 3) Sincroniza AuthService en string para el menú (no afecta la comparación)
            authService.setRole(effective === RoleEnum.ADMIN ? 'admin' : 'client');

            // 4) DEBUG
            log('check', {
              dbRoleRaw: userData?.role,
              dbRoleEnum,
              demoRoleRaw: (authService as any).currentRole,
              demoRoleEnum,
              effectiveEnum: effective,
              allowedEnums: allowed
            });

            // 5) Comparación SOLO entre enums
            if (allowed.includes(effective)) {
              log('allow', true);
              return true;
            }

            const safe = '/reservations/browse';
            log('deny -> redirect', { effectiveEnum: effective, redirect: safe });
            return router.createUrlTree([safe]);
          }),
          catchError((err) => {
            console.error('[roleGuard] Firestore error:', err);
            return of(router.createUrlTree(['/reservations/browse']));
          })
        );
      })
    );
  };
};

// Guards listos
export const adminOnlyGuard: CanActivateFn  = roleGuard([RoleEnum.ADMIN]);
export const clientOnlyGuard: CanActivateFn = roleGuard([RoleEnum.CLIENT]);
