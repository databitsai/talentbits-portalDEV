import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ReportApiService {

  pathModel = 'report';

  constructor(private readonly _http: HttpClient) { }

  processFetchResume(data: any):Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/fetchResume`, request);
  }
  fetchProcessRequestStatusCount(data: any):Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/request/fetchStatusCount`, request);
  }
  fetchProcessEvaluationAvgScore(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/evaluation/avg-score`, request);
  }
  fetchProcessEvaluationAvgTime(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/evaluation/avg-time`, request);
  }
  fetchProcessEvaluationAnswersType(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/evaluation/answers-type`, request);
  }
  fetchProcessTeamFilters(data: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/team/filters`, request);
  }
  fetchProcessEvaluationAvgScoreAvgTime(data: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/evaluation/avg-score-time`, request);
  }
  fetchProcessParticipantsScoreTable(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/participants/score-table`, request);
  }
  fetchParticipantsEvaluationAvgScoreAvgTime(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/participants/avg-score-time`, request);
  }
  fetchParticipantAnswerTypesAndScores(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/participants/answers-type`, request);
  }
  fetchProcessParticipantsFilters(data: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/participants/filters`, request);
  }
  fetchParticipantsScoresByIdProcessOrdered(data: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/team/participants-score`, request);
  }
  fetchProcessParticipantsRawScoreTable(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/participants/raw-table`, request);
  }
  fetchDataPersonasParticipantsTable(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/participants/data-personas-table`, request);
  }
  fetchDataPersonasTeamTable(data: any) {
    const request: RequestApi = new RequestApi(environment.origin, data);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/process/team/data-perosnas-table`, request);
  }
}
