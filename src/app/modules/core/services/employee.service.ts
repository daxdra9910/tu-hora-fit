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
import { EmployeeModelWithFile, EmployeeModelWithIdAndFileAndImage, EmployeeModelWithIdAndImage, EmployeeModelWithImage } from '../../shared/models/employed.model';

import { StorageService } from '../../shared/services/storage.service';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly firestore = inject(Firestore);
  private readonly storageService = inject(StorageService);
  collection = COLLECTIONS.EMPLOYEES;

  async createEmployee(employeeData: EmployeeModelWithFile) {

    // Subir la imagen y obtener la URL
    const imageUrl = await this.storageService.uploadFile(employeeData.image, `${STORAGE.IMAGES}/${this.collection}/${employeeData.image.name}`);

    const now = new Date().toISOString();
    const employeeRef = doc(this.firestore, this.collection, crypto.randomUUID());

    const data: EmployeeModelWithImage = {
      name: employeeData.name,
      phone: employeeData.phone,
      email: employeeData.email,
      role: employeeData.role,
      imageURL: imageUrl,
      createdAt: now,
      createdBy: 'system',
      updatedAt: now,
      updatedBy: 'system'
    };

    return setDoc(employeeRef, data);
  }

  async getAllEmployees(): Promise<EmployeeModelWithIdAndImage[]> {
    const employeeRef = collection(this.firestore, this.collection);
    const snapshot = await getDocs(employeeRef);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as EmployeeModelWithIdAndImage));
  }

  async updateEmployee(employeeData: EmployeeModelWithIdAndFileAndImage): Promise<void> {
    let updatedImageUrl = employeeData.imageURL;

    // Revisa si en classData image es diferente de null, de ser asi borra la imagen anterior (imageURL) y sube la nueva
    if (employeeData.image) {
      if (employeeData.imageURL) {
        await this.storageService.deleteFile(employeeData.imageURL);
      }
      updatedImageUrl = await this.storageService.uploadFile(employeeData.image, `${STORAGE.IMAGES}/${this.collection}/${employeeData.image.name}`);
    }

    // Si no hay imagen, solo actualiza el resto de los datos
    const employeeRef = doc(this.firestore, this.collection, employeeData.id);
    const { id, createdAt, createdBy, image, ...data } = employeeData;


    const updatePayload = {
      ...data,
      imageURL: updatedImageUrl,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };

    return updateDoc(employeeRef, updatePayload);
  }

  async deleteEmployee(employeeData: EmployeeModelWithIdAndImage): Promise<void> {
    const classRef = doc(this.firestore, this.collection, employeeData.id);

    if (employeeData.imageURL) {
      await this.storageService.deleteFile(employeeData.imageURL);
    }

    return deleteDoc(classRef);
  }
}
