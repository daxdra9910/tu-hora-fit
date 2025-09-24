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

import { COLLECTIONS, STORAGE } from '../../shared/constants/firebase.constant';
import {
  ClassModelWithFile,
  ClassModelWithIdAndFileAndImage,
  ClassModelWithIdAndImage,
  ClassModelWithImage
} from '../../shared/models/class.model';

import { StorageService } from '../../shared/services/storage.service';

@Injectable({ providedIn: 'root' })
export class ClassService {
  private readonly firestore = inject(Firestore);
  private readonly storageService = inject(StorageService);
  private readonly collection = COLLECTIONS.CLASSES;

  /** Crea clase y sube imagen */
  async createClass(classData: ClassModelWithFile) {
    const imageUrl = await this.storageService.uploadFile(
      classData.image,
      `${STORAGE.IMAGES}/${this.collection}/${classData.image.name}`
    );

    const now = new Date().toISOString();
    const classRef = doc(this.firestore, this.collection, crypto.randomUUID());

    const data: ClassModelWithImage = {
      name: classData.name,
      description: classData.description,
      imageURL: imageUrl,
      createdAt: now,
      createdBy: 'system',
      updatedAt: now,
      updatedBy: 'system'
    };
    return setDoc(classRef, data);
  }

  /** Lista clases (con id) */
  async getAllClasses(): Promise<ClassModelWithIdAndImage[]> {
    const classRef = collection(this.firestore, this.collection);
    const snapshot = await getDocs(classRef);

    return snapshot.docs.map(doc => ({
      ...(doc.data() as any),
      id: doc.id
    } as ClassModelWithIdAndImage));
  }

  /** Actualiza clase (y opcionalmente reemplaza imagen) */
  async updateClass(classData: ClassModelWithIdAndFileAndImage): Promise<void> {
    let updatedImageUrl = '';

    if (classData.image) {
      if (classData.imageURL) await this.storageService.deleteFile(classData.imageURL);
      updatedImageUrl = await this.storageService.uploadFile(
        classData.image,
        `${STORAGE.IMAGES}/${this.collection}/${classData.image.name}`
      );
    }

    const classRef = doc(this.firestore, this.collection, classData.id);
    const { id, createdAt, createdBy, image, ...data } = classData;

    const updatePayload = {
      ...data,
      imageURL: updatedImageUrl || classData.imageURL,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };

    return updateDoc(classRef, updatePayload);
  }

  /** Elimina clase (y su imagen) */
  async deleteClass(classData: ClassModelWithIdAndImage): Promise<void> {
    const classRef = doc(this.firestore, this.collection, classData.id);
    if (classData.imageURL) await this.storageService.deleteFile(classData.imageURL);
    return deleteDoc(classRef);
  }
}
