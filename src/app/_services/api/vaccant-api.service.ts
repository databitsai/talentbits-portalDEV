import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VaccantApiService {
    pathModel = 'vaccant';

    constructor(private readonly _http: HttpClient) { }

    findByIdVaccant(idVaccant: number):Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, idVaccant);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findByIdVaccant`, request);
    }

    findAllVaccant(data: any, page: number, size: number): Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, data);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findAll?page=${page}&size=${size}`, request);
    }

    findByAccount(idAccount: number): Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, idAccount);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findByAccount`, request);
    }

    delete(id: number): Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, id);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/delete`, request);
    }

    create(account: any): Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, account);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/create`, request);
    }
  
    updateResume(account: any): Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, account);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/updateResume`, request);
    }

    update(account: any): Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, account);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update`, request);
    }
    
    findVaccantRequestByIdVaccant(idVaccant: number):Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, idVaccant);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findVaccantRequestByIdVaccant`, request);
    }

    deleteVaccantRequestById(id: number): Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, id);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/deleteVaccantRequestById`, request);
    }

    selectRequestById(idRequest: number) {
      const request: RequestApi = new RequestApi(environment.origin, idRequest);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/select-request`, request);
    }
    updateIdProcessInVaccant(idVaccant: any, idProcess:any) {
      const request: RequestApi = new RequestApi(environment.origin, {idVaccant, idProcess});
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/updateIdProcessInVaccant`, request);
    }
    findByAccountWithoutProcess(idAccount: number): Observable<ResponseApi> {
      const request: RequestApi = new RequestApi(environment.origin, idAccount);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findByAccountWithoutProcess`, request);
    }
    findVaccantByIdProcess(idProcess: number) {
      const request: RequestApi = new RequestApi(environment.origin, idProcess);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findVaccantByIdProcess`, request)
    }
    createRequestMembership(data: any) {
      const request: RequestApi = new RequestApi(environment.origin, data);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/create-request-membership`, request)
    }
    selectAllRequests(data: any) {
      const request: RequestApi = new RequestApi(environment.origin, data);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/select-all-request`, request);
    }
    transferRequestsToProcess(idVaccant: number) {
      const request: RequestApi = new RequestApi(environment.origin, idVaccant);
      return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/transfer-all-request`, request);
    }
}