import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProcessRequestApiService {

  pathModel = 'process-request';

  constructor(private readonly _http: HttpClient) { }
  validate(params: any) {
    const request: RequestApi = new RequestApi(environment.origin, params);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/validate`, request);
  }
  register(id: number, code: string) {
    const request: RequestApi = new RequestApi(environment.origin, {id, code});
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/register`, request);
  }
  add(id: number, code: string) {
    const request: RequestApi = new RequestApi(environment.origin, {id, code});
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/add`, request);
  }
  newInvited(info: any) {
    const request: RequestApi = new RequestApi(environment.origin, info);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/new`, request);
  }
}
