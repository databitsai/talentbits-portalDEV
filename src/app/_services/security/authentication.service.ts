import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError} from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Authority } from 'src/app/_models/Authority';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { TokenClaims } from 'src/app/_models/TokenClaims';
import { TokenInfo } from 'src/app/_models/TokenInfo';
import { ACCOUNT_SELECTED_ROUTE, PROCESS_SELECTED_ROUTE, PROCESS_USER_SELECTED_EVALUATION, PROCESS_USER_SELECTED_ROUTE, STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED, TOKEN_INFO_ACCESS, TOKEN_INFO_LABEL, VACANT_SELECTED_ROUTE } from 'src/app/_utils/constants';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  pathModel = 'oauth/token';

  constructor(private _http: HttpClient,
    private readonly _storage: StorageService) { }
  login(username: string, password: string): Observable<any> {
    return this.getAccessToken(username, password)
      .pipe(
        tap((resp: ResponseApi) => {
          this._storage.deleteKey(STORAGE_LOCAL, TOKEN_INFO_LABEL);
          this._storage.deleteKey(STORAGE_LOCAL, TOKEN_INFO_ACCESS);

          this._storage.createObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS, resp.result.authorities ?? []);
          this._storage.createObject(STORAGE_LOCAL, TOKEN_INFO_LABEL, resp.result);
        }),
        map((resp: ResponseApi) => resp.result.authorities ?? [])
      );
  }
  getAccessToken(username: string, password: string): Observable<ResponseApi> {
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': 'es-ES'
    });
    const request: RequestApi = new RequestApi(environment.origin, { username, password });
    return this._http.post<ResponseApi>(`${environment.authUrl}/oauth/token`, request, { headers: httpHeaders });
  }
  refreshToken(): Observable<any> {
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept-Language': 'es-ES'
    });
    const request: RequestApi = new RequestApi(environment.origin, { token: this.getTokenStored(), refresh: this.getRefreshTokenStored() });
    return this._http.post<ResponseApi>(`${environment.authUrl}/oauth/token/refresh`, request, { headers: httpHeaders })
    .pipe(
      mergeMap((resp: ResponseApi) => resp.status === 'OK' ? of(resp.result) : throwError(resp)),
      tap((tokenInfo: TokenInfo) => {
        this._storage.deleteKey(STORAGE_LOCAL, TOKEN_INFO_LABEL);
        this._storage.deleteKey(STORAGE_LOCAL, TOKEN_INFO_ACCESS);

        this._storage.createObject(STORAGE_LOCAL, TOKEN_INFO_LABEL, tokenInfo);
        this._storage.createObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS, tokenInfo.authorities ?? []);
      })
    );
  }
  getTokenClaims(): TokenClaims {
    const tokenInfo: TokenInfo = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_LABEL);
    return this.parseJwt(tokenInfo.token);
  }
  parseJwt(token: string): any {
    try {
      var base64Url = token.split('.')[1];
      var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch(e) {
      return null;
    }
  };
  logout() {
    this._storage.deleteKey(STORAGE_LOCAL, TOKEN_INFO_LABEL);
    this._storage.deleteKey(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
    this._storage.deleteKey(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
    this._storage.deleteKey(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
    this._storage.deleteKey(STORAGE_LOCAL, PROCESS_USER_SELECTED_ROUTE);
    this._storage.deleteKey(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION);
    this._storage.deleteKey(STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED);
    this._storage.deleteKey(STORAGE_LOCAL, VACANT_SELECTED_ROUTE);
  }
  getAccessRole(): Authority | null {
    try {
      const tokenClaims: Authority[] = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
      return tokenClaims.length > 0 ? tokenClaims[0] : null;
    } catch(e) {
      return null;
    }
  }
  getTokenStored(): string {
    const tokenInfo: TokenInfo = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_LABEL);
    return tokenInfo.token;
  }
  getRefreshTokenStored(): string {
    const tokenInfo: TokenInfo = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_LABEL);
    return tokenInfo.refresh;
  }
  sendRecoverPasswordEmail(email: string) {
    const request: RequestApi = new RequestApi(environment.origin, email);
    return this._http.post<ResponseApi>(`${environment.authUrl}/${this.pathModel}/send-recover-password-email`, request);
  }
  verifyAction(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.authUrl}/${this.pathModel}/verify-action`, request);
  }
  changePassword(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.authUrl}/${this.pathModel}/change-password`, request);
  }
}
