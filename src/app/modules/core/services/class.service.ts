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
import { ClassModelWithFile, ClassModelWithIdAndFileAndImage, ClassModelWithIdAndImage, ClassModelWithImage } from '../../shared/models/class.model';

import { StorageService } from '../../shared/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class ClassService {
  private readonly firestore = inject(Firestore);
  private readonly storageService = inject(StorageService);
  private readonly collection = COLLECTIONS.CLASSES;

  /**
   * @description Crea una nueva clase y sube la imagen asociada al almacenamiento
   * @param classData - Objeto que contiene los datos de la clase y el archivo de imagen
   * @returns Promesa que se resuelve cuando la clase ha sido creada exitosamente
   */
  async createClass(classData: ClassModelWithFile) {

    // Subir la imagen y obtener la URL
    const imageUrl = await this.storageService.uploadFile(classData.image, `${STORAGE.IMAGES}/${this.collection}/${classData.image.name}`)

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

  /**
   * @description Obtiene todas las clases almacenadas en la base de datos
   * @returns Promesa que resuelve a un arreglo de clases con sus respectivas IDs e imágenes
   */
  async getAllClasses(): Promise<ClassModelWithIdAndImage[]> {
    const classRef = collection(this.firestore, this.collection);
    const snapshot = await getDocs(classRef);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as ClassModelWithIdAndImage));
  }

  /**
   * @description Actualiza la información de una clase existente, incluida su imagen si ha cambiado
   * @param classData - Objeto con la información actualizada, incluyendo opcionalmente una nueva imagen
   * @returns Promesa que se resuelve cuando la clase ha sido actualizada
   */
  async updateClass(classData: ClassModelWithIdAndFileAndImage): Promise<void> {
    let updatedImageUrl = '';
    
    // Revisa si en classData image es diferente de null, de ser asi borra la imagen anterior (imageURL) y sube la nueva
    if (classData.image) {
      if (classData.imageURL) {
        await this.storageService.deleteFile(classData.imageURL);
      }
      updatedImageUrl = await this.storageService.uploadFile(classData.image, `${STORAGE.IMAGES}/${this.collection}/${classData.image.name}`);
    }
    
    // Si no hay imagen, solo actualiza el resto de los datos
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

  /**
   * @description Elimina una clase de la base de datos y borra la imagen asociada del almacenamiento
   * @param classData - Objeto que contiene la ID de la clase y la URL de la imagen
   * @returns Promesa que se resuelve cuando la clase ha sido eliminada
   */
  async deleteClass(classData: ClassModelWithIdAndImage): Promise<void> {
    const classRef = doc(this.firestore, this.collection, classData.id);

    if (classData.imageURL) {
     await this.storageService.deleteFile(classData.imageURL);
    }

    return deleteDoc(classRef);
  }
}
