import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserProcessApiService {

  pathModel = 'userProcess';

  constructor(private readonly _http: HttpClient) { }
  
  findByMembership(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findByMembership`, request);
  }
  createEvaluation(info: any) {
    const request: RequestApi = new RequestApi(environment.origin, info);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/createEvaluation`, request);
  }
  findEvaluation(info: any) {
    const request: RequestApi = new RequestApi(environment.origin, info);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findEvaluation`, request);
  }
  findEvaluationById(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findEvaluationById`, request);
  }
  initializeEvaluationById(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/initializeEvaluationById`, request);
  }
  finishEvaluationById(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/finishEvaluationById`, request);
  }
  saveAnswer(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/saveAnswer`, request);
  }
  deleteAnswer(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/deleteAnswer`, request);
  }
  findQuestionAnswer(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findQuestionAnswer`, request);
  }
  fetchMemberEvaluationResultsById(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/fetchMemberEvaluationResultsById`, request);
  }
  fetchEvaluationsQuestionsByProcess(idProcess: number, idProcessRequest:number) {
    const request: RequestApi = new RequestApi(environment.origin, {idProcess, idProcessRequest});
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/fetchEvaluationsQuestionsByProcess`, request);
  }
}
