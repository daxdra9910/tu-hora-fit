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

import { getStorage, ref as storageRef, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private readonly firestore = inject(Firestore);
  private readonly storage = getStorage(); // ✅ Acceso al storage de Firebase

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

  async updateClass(classData: ClassModel, oldImageURL?: string): Promise<void> {
    const classRef = doc(this.firestore, COLLECTIONS.CLASSES, classData.id!);
    const { id, ...data } = classData;

    // ✅ Si hay imagen anterior y es diferente a la nueva, la eliminamos
    if (oldImageURL && oldImageURL !== classData.imageURL) {
      try {
        const imageRef = storageRef(this.storage, oldImageURL);
        await deleteObject(imageRef);
        console.log('🧹 Imagen anterior eliminada del storage');
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar la imagen anterior:', error);
      }
    }

    return updateDoc(classRef, data);
  }

  async deleteClass(classData: ClassModel): Promise<void> {
    const classRef = doc(this.firestore, COLLECTIONS.CLASSES, classData.id!);

    // 🧼 Eliminar imagen del Storage si existe
    if (classData.imageURL) {
      try {
        const imageRef = storageRef(this.storage, classData.imageURL);
        await deleteObject(imageRef);
        console.log('🗑️ Imagen eliminada del Storage');
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar la imagen del Storage:', error);
      }
    }

    return deleteDoc(classRef);
  }
}
