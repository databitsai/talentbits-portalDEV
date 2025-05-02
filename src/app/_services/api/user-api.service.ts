import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { UserApp } from 'src/app/_models/UserApp';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserApiService {

  pathModel = 'user';

  constructor(private readonly _http: HttpClient) { }
  createUserAccount(userInfo: any) {
    const request: RequestApi = new RequestApi(environment.origin, userInfo);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/createUserAccount`, request);
  }
  update(user: UserApp): Observable<any> {
    const request: RequestApi = new RequestApi(environment.origin, user);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update`, request);
  }
  findAllByAccount(idAccount: number) {
    const request: RequestApi = new RequestApi(environment.origin, idAccount);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findAllByAccount`, request);
  }
  fetchFromMembership(idMembership: number) {
    const request: RequestApi = new RequestApi(environment.origin, idMembership);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/fetchFromMembership`, request);
  }
  checkCreateUserCorporative(userInfo: any) {
    const request: RequestApi = new RequestApi(environment.origin, userInfo);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/checkCreateUserCorporative`, request);
  }
  findRegistrationsByMembership(idMembership: number) {
    const request: RequestApi = new RequestApi(environment.origin, idMembership);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findRegistrationsByMembership`, request);
  }
  activeRegistrationMembership(idRegistration: number, idMembership: number) {
    const request: RequestApi = new RequestApi(environment.origin, {idRegistration, idMembership});
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/activeRegistrationMembership`, request);
  }
  uploadCv(formData: any) {
    const request: RequestApi = new RequestApi(environment.origin, formData);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/uploadCv`, request);
  }
  deleteCv(formData: any) {
    const request: RequestApi = new RequestApi(environment.origin, formData);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/deleteCv`, request);
  }
  readCvFilename(formData: any) {
    const request: RequestApi = new RequestApi(environment.origin, formData);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/readCvFilename`, request);
  }
  readCvFile(formData: any) {
    const request: RequestApi = new RequestApi(environment.origin, formData);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/readCvFile`, request);
  }
}
