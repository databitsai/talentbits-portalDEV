import { Injectable, OnDestroy } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { Observable, Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StorageService implements OnDestroy {
  private onSubject = new Subject<{ key: string, value: any }>();
  public changes: Observable<any> = this.onSubject.asObservable().pipe(share());

  constructor() {
    this.start();
  }
  createObject(target: string, name: string, src: any) {
    const encryptedSrc = CryptoJS.AES.encrypt(JSON.stringify(src), environment.secret).toString();
    switch (target) {
      case 'session':
        sessionStorage.setItem(name, encryptedSrc);
        this.onSubject.next({ key: name, value: src});
        break;
      case 'local':
        localStorage.setItem(name, encryptedSrc);
        this.onSubject.next({ key: name, value: src});
        break;
    }
  }
  getObject(target: string, name: string): any | null {
    try {
      let storeCipher: string | null = null;
      switch (target) {
        case 'session':
          storeCipher = sessionStorage.getItem(name);
          break;
        case 'local':
          storeCipher = localStorage.getItem(name);
          break;
      }
      if (storeCipher !== null) {
        const session_bytes  = CryptoJS.AES.decrypt(storeCipher, environment.secret);
        return JSON.parse(session_bytes.toString(CryptoJS.enc.Utf8));
      } else {
        return null;
      }
    } catch(err) {
      console.log(err);
      return null;
    } 
  }
  createStringValue(target: string, name: string, src: any) {
    const encryptedSrc = CryptoJS.AES.encrypt(src, environment.secret).toString();
    switch (target) {
      case 'session':
        sessionStorage.setItem(name, encryptedSrc);
        this.onSubject.next({ key: name, value: encryptedSrc});
        break;
      case 'local':
        localStorage.setItem(name, encryptedSrc);
        this.onSubject.next({ key: name, value: encryptedSrc});
        break;
    }
  }
  getStringValue(target: string, name: string): any | null {
    let storeCipher: string | null = null;
    switch (target) {
      case 'session':
        storeCipher = sessionStorage.getItem(name);
        break;
      case 'local':
        storeCipher = localStorage.getItem(name);
        break;
    }
    if (storeCipher !== null) {
      const session_bytes  = CryptoJS.AES.decrypt(storeCipher, environment.secret);
      return session_bytes.toString(CryptoJS.enc.Utf8);
    } else {
      return null;
    }
  }
  createRawValue(target: string, name: string, src: any) {
    switch (target) {
      case 'session':
        sessionStorage.setItem(name, src);
        this.onSubject.next({ key: name, value: src});
        break;
      case 'local':
        localStorage.setItem(name, src);
        this.onSubject.next({ key: name, value: src});
        break;
    }
  }
  getRawValue(target: string, name: string): any | null {
    let storeValue: string | null = null;
    switch (target) {
      case 'session':
        storeValue = sessionStorage.getItem(name);
        break;
      case 'local':
        storeValue = localStorage.getItem(name);
        break;
    }
    if (storeValue !== null) {
      return storeValue;
    } else {
      return null;
    }
  }
  existKey(target: string, name: string): boolean {
    switch (target) {
      case 'session':
        return sessionStorage.getItem(name) !== null;
      case 'local':
        return localStorage.getItem(name) !== null;
      default:
        return false;
    }
  }
  deleteKey(target: string, name: string) {
    switch (target) {
      case 'session':
        if (sessionStorage.getItem(name) !== null) {
          sessionStorage.removeItem(name);
          this.onSubject.next({ key: name, value: null });
        }
        break;
      case 'local':
        if (localStorage.getItem(name) !== null) {
          localStorage.removeItem(name);
          this.onSubject.next({ key: name, value: null });
        }
        break;
    }
  }
  // listener
  ngOnDestroy(): void {
    this.stop();
  }
  private start(): void {
    window.addEventListener("storage", this.storageEventListener.bind(this));
  }
  private storageEventListener(event: StorageEvent) {
    if (event.storageArea == localStorage) {
      let v;
      try { v = JSON.parse(event.newValue ?? ''); }
      catch (e) { v = event.newValue; }
      this.onSubject.next({ key: event.key ?? '', value: v });
    }
  }
  private stop(): void {
    window.removeEventListener("storage", this.storageEventListener.bind(this));
    this.onSubject.complete();
  }
}
