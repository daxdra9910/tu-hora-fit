import {inject, Injectable} from '@angular/core';
import {
  collection, deleteDoc,
  doc,
  endAt,
  Firestore,
  getDocs,
  orderBy,
  query,
  setDoc,
  startAt,
  updateDoc
} from "@angular/fire/firestore";
import {UserModel} from "../../shared/models/user.model";
import {COLLECTIONS} from "../../shared/constants/firebase.constant";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly firestore = inject(Firestore);

  createUser(user: UserModel) {
    const userRef = doc(this.firestore, COLLECTIONS.USERS, user.uid);
    return setDoc(userRef, user);
  }

  async getAllUsers() {
    const usersRef = collection(this.firestore, COLLECTIONS.USERS);
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map(doc => {
      return {
        ...doc.data(),
        uid: doc.id
      } as UserModel;
    });
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

  async updateUser(user: UserModel): Promise<void> {
    const userRef = doc(this.firestore, COLLECTIONS.USERS, user.uid);
    const { uid, ...userData } = user; // quitamos el uid para no guardarlo dos veces

    await updateDoc(userRef, userData);
  }

  async deleteUser(user: UserModel): Promise<void> {
    const userRef = doc(this.firestore, COLLECTIONS.USERS, user.uid);
    await deleteDoc(userRef);
  }

}
