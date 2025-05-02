import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Plan } from 'src/app/_models/Plan';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PlanApiService {

  pathModel = 'plan';

  constructor(private readonly _http: HttpClient) { }
  create(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/create`, request);
  }
  update(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update`, request);
  }
  findAll(): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, {});
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findAll`, request);
  }
  findTemplateAll(): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, {});
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findTemplateAll`, request);
  }
  findById(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findById`, request);
  }
  delete(id: number): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/delete`, request);
  }
  deleteAll(accounts: Plan[]): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, accounts);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/deleteAll`, request);
  }
}
