import { Inject, Injectable } from '@angular/core';
import { doc, Firestore, setDoc } from '@angular/fire/firestore'

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private readonly firestore = Inject(Firestore);

  setDocument(path: string, data: any) {
    return setDoc(doc(this.firestore, path), data);
  }
}
