import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class GeminiService {
  private readonly apiKey = 'AIzaSyAgVy1TcmHqOubjyS7_CHMt5V0gPPr4apg'; // 🔐 pega aquí tu clave
  private readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  constructor(private http: HttpClient) {}

  askGemini(message: string) {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    const body = {
      contents: [
        {
          parts: [
            {
              text: `
Eres un entrenador personal experto. El usuario te dirá qué parte del cuerpo quiere trabajar o qué objetivo desea (masa, definición, cardio, etc).
Tu trabajo es responder con una rutina clara y enfocada solo en entrenamiento físico.

Mensaje del usuario: "${message}"
              `
            }
          ]
        }
      ]
    };

    return this.http.post(`${this.endpoint}?key=${this.apiKey}`, body, { headers });
  }
}
