import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Account } from 'src/app/_models/Account';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountApiService {

  pathModel = 'account';

  constructor(private readonly _http: HttpClient) { }
  createCorporative(account: any) {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/corporative/create`, request);
  }
  creatAdministrator(account: any) {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/administrator/create`, request);
  }
  update(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update`, request);
  }
  findAllCorporative() {
    const request: RequestApi = new RequestApi(environment.origin, {});
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/corporative/findAll`, request);
  }
  delete(id: number): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/delete`, request);
  }
  findCorporativeByMembership(idMembership: number) {
    const request: RequestApi = new RequestApi(environment.origin, idMembership);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/corporative/findByMembership`, request);
  }
  findIndividualByMembership(idMembership: number) {
    const request: RequestApi = new RequestApi(environment.origin, idMembership);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/individual/findByMembership`, request);
  }
  findAllByType(typeAccount: string) {
    const request: RequestApi = new RequestApi(environment.origin, typeAccount);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findAllByType`, request);
  }
}
