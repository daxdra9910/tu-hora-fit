import { inject, Injectable } from '@angular/core';
import { deleteObject, getDownloadURL, ref, Storage, uploadBytesResumable } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  private readonly storage = inject(Storage);

  /**
   * Sube un archivo al almacenamiento en la ruta especificada.
   * @param file - El archivo a subir.
   * @param path - La ruta completa en el storage donde se almacenará el archivo.
   * @returns Una promesa que resuelve con la URL pública del archivo subido.
   */
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        null,
        (error) => {
          console.error('Error uploading image:', error);
          reject(error);
        },
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  /**
   * Elimina un archivo del almacenamiento.
   * Puede recibir una URL completa o una ruta relativa.
   * @param urlOrPath - La URL o ruta del archivo a eliminar.
   * @returns Una promesa que se resuelve cuando el archivo ha sido eliminado.
   */
  async deleteFile(path: string): Promise<void> {
    const storageRef = ref(this.storage, path);
    await deleteObject(storageRef);
  }

  /**
   * Obtiene la URL pública de un archivo almacenado.
   * @param path - Ruta relativa del archivo en el storage.
   * @returns Una promesa que resuelve con la URL pública.
   */
  async getFileUrl(path: string): Promise<string> {
    const storageRef = ref(this.storage, path);
    return getDownloadURL(storageRef);
  }

}
