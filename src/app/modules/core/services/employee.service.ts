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

import { EmployeeModel } from '../../shared/models/employed.model';
import { COLLECTIONS } from '../../shared/constants/firebase.constant';

import { getStorage, ref as storageRef, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  private readonly firestore = inject(Firestore);
  private readonly storage = getStorage();

  createEmployee(employeeData: EmployeeModel) {
    const employeeRef = doc(this.firestore, COLLECTIONS.EMPLOYEES, crypto.randomUUID());
    return setDoc(employeeRef, employeeData);
  }

  async getAllEmployees(): Promise<EmployeeModel[]> {
    const employeeRef = collection(this.firestore, COLLECTIONS.EMPLOYEES);
    const snapshot = await getDocs(employeeRef);

    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as EmployeeModel));
  }

  async updateEmployee(employeeData: EmployeeModel, oldImageURL?: string): Promise<void> {
    const employeeRef = doc(this.firestore, COLLECTIONS.EMPLOYEES, employeeData.id!);
    const { id, ...data } = employeeData;

    // Eliminar imagen anterior si es distinta
    if (oldImageURL && oldImageURL !== employeeData.imageURL) {
      try {
        const imageRef = storageRef(this.storage, oldImageURL);
        await deleteObject(imageRef);
        console.log('🧹 Imagen anterior eliminada del storage');
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar la imagen anterior:', error);
      }
    }

    return updateDoc(employeeRef, data);
  }

  async deleteEmployee(employeeData: EmployeeModel): Promise<void> {
    const employeeRef = doc(this.firestore, COLLECTIONS.EMPLOYEES, employeeData.id!);

    if (employeeData.imageURL) {
      try {
        const imageRef = storageRef(this.storage, employeeData.imageURL);
        await deleteObject(imageRef);
        console.log('🗑️ Imagen eliminada del Storage');
      } catch (error) {
        console.warn('⚠️ No se pudo eliminar la imagen del Storage:', error);
      }
    }

    return deleteDoc(employeeRef);
  }
}
