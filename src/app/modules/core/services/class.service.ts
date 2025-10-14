import { inject, Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDocs,
  setDoc,
  updateDoc,
  query,          // <-- NUEVO
  where           // <-- NUEVO
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

  /** 🔎 Trae clases por IDs (chunk de 10 por límite del operador `in`) */
  async getByIds(ids: string[]): Promise<ClassModelWithIdAndImage[]> {
    if (!ids || ids.length === 0) return [];

    // quitar duplicados y preparar chunks de máximo 10
    const unique = Array.from(new Set(ids));
    const chunks: string[][] = [];
    for (let i = 0; i < unique.length; i += 10) {
      chunks.push(unique.slice(i, i + 10));
    }

    const colRef = collection(this.firestore, this.collection);
    const results: ClassModelWithIdAndImage[] = [];

    for (const part of chunks) {
      const qy = query(colRef, where('__name__', 'in', part));
      const snap = await getDocs(qy);
      results.push(
        ...snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ClassModelWithIdAndImage[]
      );
    }

    // opcional: devolver en el mismo orden solicitado en `ids`
    const map = new Map(results.map(r => [r.id, r]));
    return unique.map(id => map.get(id)).filter(Boolean) as ClassModelWithIdAndImage[];
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
