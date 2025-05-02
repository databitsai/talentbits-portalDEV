import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProcessApiService {

  pathModel = 'process';

  constructor(private readonly _http: HttpClient) { }
  create(process: any) {
    const request: RequestApi = new RequestApi(environment.origin, process);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/create`, request);
  }
  findByAccount(idAccount: number) {
    const request: RequestApi = new RequestApi(environment.origin, idAccount);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findByAccount`, request);
  }
  update(process: any) {
    const request: RequestApi = new RequestApi(environment.origin, process);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update`, request);
  }
  createRequest(process: any) {
    const request: RequestApi = new RequestApi(environment.origin, process);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/create-request`, request);
  }
  findRequests(idProcess: number) {
    const request: RequestApi = new RequestApi(environment.origin, idProcess);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findRequests`, request);
  }
  updateRequest(process: any) {
    const request: RequestApi = new RequestApi(environment.origin, process);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update-request`, request);
  }
  findRequestById(idRequest: number) {
    const request: RequestApi = new RequestApi(environment.origin, idRequest);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findRequestById`, request);
  }
  deleteRequestById(idRequest: number) {
    const request: RequestApi = new RequestApi(environment.origin, idRequest);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/delete-request`, request);
  }
  selectRequestById(idRequest: number) {
    const request: RequestApi = new RequestApi(environment.origin, idRequest);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/select-request`, request);
  }
  createRequestBulk(process: any) {
    const request: RequestApi = new RequestApi(environment.origin, process);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/create-request-bulk`, request);
  }
  addEvaluation(addEvaluation: any) {
    const request: RequestApi = new RequestApi(environment.origin, addEvaluation);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/add-evaluation`, request);
  }
  removeEvaluation(addEvaluation: any) {
    const request: RequestApi = new RequestApi(environment.origin, addEvaluation);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/remove-evaluation`, request);
  }
  findEvaluations(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/find-evaluations`, request);
  }
  sendProcessRequest(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/send-process-request`, request);
  }
  disable(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/disable`, request);
  }

  findAllByVaccantIsNullAndIdAccount(idAccount: number) {
    const request: RequestApi = new RequestApi(environment.origin, idAccount);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findAllByVaccantIsNullAndIdAccount`, request);
  }
  fetchEvaluationsQuestionsByProcess(idProcess: number, idProcessRequest:number) {
    const request: RequestApi = new RequestApi(environment.origin, {idProcess, idProcessRequest});
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/fetchEvaluationsQuestionsByProcess`, request);
  }
  selectAllRequests(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/select-all-request`, request);
  }
}
