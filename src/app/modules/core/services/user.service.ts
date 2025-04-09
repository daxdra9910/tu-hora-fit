import {inject, Injectable} from '@angular/core';
import {collection, doc, Firestore, getDocs, setDoc} from "@angular/fire/firestore";
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
}
