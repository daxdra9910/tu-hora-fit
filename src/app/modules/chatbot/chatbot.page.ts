import { Component, OnInit, ViewChild, ElementRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../core/services/gemini.service';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent,
  IonItem, IonInput, IonAvatar, IonBackButton, IonFooter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { send, trashOutline, chatbubbleEllipses, flash, refresh, walk, barbell, body, fitness, accessibility, pulse } from 'ionicons/icons';

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  templateUrl: './chatbot.page.html',
  styleUrls: ['./chatbot.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonItem,
    IonInput,
    IonAvatar,
    IonBackButton,
    IonFooter
  ]
})
export class ChatbotPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly geminiService = inject(GeminiService);

  @ViewChild('content', { static: false }) content!: IonContent;
  @ViewChild('messageInput') messageInput!: ElementRef;

  chatForm!: FormGroup;
  messages: Array<{
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
    quickReplies?: string[];
  }> = [];
  loading = false;

  constructor() {
    addIcons({
      flash, refresh, send, trashOutline, chatbubbleEllipses,
      walk, barbell, body, fitness, accessibility, pulse
    });
  }

  ngOnInit(): void {
    this.initializeForm();
    this.welcomeMessage();
  }

  private initializeForm(): void {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.maxLength(500)]]
    });
  }

  private welcomeMessage(): void {
    this.addBotMessage(
      '¡Hola! Soy EnergIA, tu asistente de fitness personal. Elige un grupo muscular para entrenar:',
      [
        'Entrenamiento Piernas',
        'Entrenamiento Pecho',
        'Entrenamiento Espalda',
        'Entrenamiento Brazos',
        'Entrenamiento Hombros',
        'Entrenamiento Abdomen'
      ]
    );
  }

  async sendMessage(): Promise<void> {
    const input = this.chatForm.get('message')?.value.trim();
    if (!input || this.loading) return;

    this.addUserMessage(input);
    this.chatForm.reset();
    this.loading = true;
    this.scrollToBottom();

    try {
      const response = await this.geminiService.askGemini(input).toPromise() as GeminiResponse;
      const reply = response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        'No pude entender tu solicitud. ¿Podrías reformularla?';

      await this.typeBotMessage(reply);
    } catch (error) {
      console.error('Error calling Gemini:', error);
      this.addBotMessage('¡Vaya! Algo salió mal. Por favor, inténtalo de nuevo más tarde.');
    } finally {
      this.loading = false;
      setTimeout(() => this.scrollToBottom(), 100);
      this.setFocusOnInput();
    }
  }

  sendQuickReply(reply: string): void {
    this.chatForm.get('message')?.setValue(reply);
    this.sendMessage();
  }

  clearChat(): void {
    this.messages = [];
    this.welcomeMessage();
  }

  private addUserMessage(text: string): void {
    this.messages.push({
      sender: 'user',
      text: text,
      timestamp: new Date()
    });
  }

  private addBotMessage(text: string, quickReplies?: string[]): void {
    this.messages.push({
      sender: 'bot',
      text: text,
      timestamp: new Date(),
      quickReplies
    });
  }

  private async typeBotMessage(fullText: string): Promise<void> {
    const typingSpeed = 20; // milisegundos por carácter
    let currentText = '';
    this.addBotMessage('');

    for (let i = 0; i < fullText.length; i++) {
      currentText += fullText[i];
      this.messages[this.messages.length - 1].text = currentText;
      await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }
  }

  private async scrollToBottom(): Promise<void> {
    if (this.content) {
      setTimeout(async () => {
        await this.content.scrollToBottom(300);
      }, 100);
    }
  }

  private setFocusOnInput(): void {
    setTimeout(() => {
      if (this.messageInput?.nativeElement?.setFocus) {
        this.messageInput.nativeElement.setFocus();
      }
    }, 150);
  }

  formatMessage(text: string): string {
    if (!text) return '';

    // Convertir negritas: **texto** → <strong>texto</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convertir saltos de línea a <br> temporalmente
    formatted = formatted.replace(/\r?\n/g, '<br>');

    // Agrupar viñetas (* item) como lista <ul><li>
    // Paso 1: Detectar líneas con "* texto"
    formatted = formatted.replace(/(?:<br>)?\* (.*?)<br>/g, '<li>$1</li><br>');

    // Paso 2: Agrupar listas consecutivas dentro de <ul>
    formatted = formatted.replace(/(<li>.*?<\/li><br>)+/g, match => {
      const cleaned = match.replace(/<br>/g, '');
      return `<ul>${cleaned}</ul>`;
    });

    return formatted;
  }


  getIconForOption(option: string): string {
    if (option.includes('Piernas')) return 'walk';
    if (option.includes('Pecho')) return 'barbell';
    if (option.includes('Espalda')) return 'body';
    if (option.includes('Brazos')) return 'fitness';
    if (option.includes('Hombros')) return 'accessibility';
    if (option.includes('Abdomen')) return 'pulse';
    return 'flash';
  }
}
