import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class CustomToastService {

  constructor(private messageService: MessageService) { }

  addPrimeToast(type: string, title: string, detail: string) {
    this.messageService.add({severity: type, summary: title, detail: detail});
  }
}
