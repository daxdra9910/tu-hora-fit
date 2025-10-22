import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  setDoc,
  updateDoc
} from '@angular/fire/firestore';

import { ClassModel } from '../../shared/models/class.model';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';

import { getStorage, ref, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private readonly firestore = inject(Firestore);
  private readonly storage = getStorage(); // 👈 Accedemos al Storage

  createClass(classData: ClassModel) {
    const classRef = doc(this.firestore, COLLECTIONS.CLASSES, crypto.randomUUID());
    return setDoc(classRef, classData);
  }

  async getAllClasses(): Promise<ClassModel[]> {
    const classRef = collection(this.firestore, COLLECTIONS.CLASSES);
    const snapshot = await getDocs(classRef);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as ClassModel));
  }

  updateClass(classData: ClassModel): Promise<void> {
    const classRef = doc(this.firestore, COLLECTIONS.CLASSES, classData.id!);
    const { id, ...data } = classData;
    return updateDoc(classRef, data);
  }

  async deleteClass(classData: ClassModel): Promise<void> {
    const classRef = doc(this.firestore, COLLECTIONS.CLASSES, classData.id!);

    // 🧼 Eliminar imagen del Storage si existe
    if (classData.imageURL) {
      try {
        const storageRef = ref(this.storage, classData.imageURL);
        await deleteObject(storageRef);
        console.log('🧹 Imagen eliminada del Storage correctamente');
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar la imagen del Storage:', error);
      }
    }

    // 🔥 Eliminar documento de Firestore
    return deleteDoc(classRef);
  }
}
