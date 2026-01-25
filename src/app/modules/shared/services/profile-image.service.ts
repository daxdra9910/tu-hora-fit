import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProfileImageService {

  private readonly endpoint =
    'https://us-central1-tu-hora-fit.cloudfunctions.net/uploadProfileImage';

  async uploadProfileImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Error subiendo imagen');
    }

    const data = await response.json();
    return data.url; // ← URL pública
  }
}
