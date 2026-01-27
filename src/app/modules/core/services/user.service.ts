import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  endAt,
  Firestore,
  getDocs,
  orderBy,
  query,
  setDoc,
  startAt,
  updateDoc
} from '@angular/fire/firestore';
import { UserModel } from '../../shared/models/user.model';
import { COLLECTIONS, STORAGE } from '../../shared/constants/firebase.constant';
import { StorageService } from '../../shared/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly firestore = inject(Firestore);
  private readonly storageService = inject(StorageService);

  async createUser(user: UserModel) {
    const userRef = doc(this.firestore, COLLECTIONS.USERS, user.uid);
    return setDoc(userRef, user);
  }

  async getAllUsers(): Promise<UserModel[]> {
    const usersRef = collection(this.firestore, COLLECTIONS.USERS);
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      uid: doc.id
    })) as UserModel[];
  }

  async searchUsers(search: string): Promise<UserModel[]> {
    if (!search.trim()) {
      return this.getAllUsers();
    }

    const usersRef = collection(this.firestore, COLLECTIONS.USERS);

    const displayNameQuery = query(
      usersRef,
      orderBy('displayName'),
      startAt(search),
      endAt(search + '\uf8ff')
    );

    const emailQuery = query(
      usersRef,
      orderBy('email'),
      startAt(search),
      endAt(search + '\uf8ff')
    );

    const [displayNameSnapshot, emailSnapshot] = await Promise.all([
      getDocs(displayNameQuery),
      getDocs(emailQuery)
    ]);

    const allDocs = [...displayNameSnapshot.docs, ...emailSnapshot.docs];

    const uniqueUsersMap = new Map<string, UserModel>();
    allDocs.forEach(doc => {
      uniqueUsersMap.set(doc.id, {
        ...doc.data(),
        uid: doc.id
      } as UserModel);
    });

    return Array.from(uniqueUsersMap.values());
  }

  updateUser(user: UserModel) {
  const ref = doc(this.firestore, 'users', user.uid);
  return updateDoc(ref, {
    displayName: user.displayName,
    phoneNumber: user.phoneNumber,
    birthdate: user.birthdate,
    photoURL: user.photoURL ?? null, // ✅ ESTA LÍNEA ES LA CLAVE
    updatedAt: user.updatedAt,
    updatedBy: user.updatedBy
  });
}


  async deleteUser(user: UserModel): Promise<void> {
    const userRef = doc(this.firestore, COLLECTIONS.USERS, user.uid);
    await deleteDoc(userRef);
  }
}
