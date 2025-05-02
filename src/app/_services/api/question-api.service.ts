import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class QuestionApiService {

  pathModel = 'question';

  constructor(private readonly _http: HttpClient) { }

  findByEvaluationId(idEvaluation: number):Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, idEvaluation);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findByEvaluationId`, request);
  }

  delete(id: number): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/delete`, request);
  }

  create(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/create`, request);
  }

  update(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update`, request);
  }

  findByIdQuestion(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findByIdQuestion`, request);
  }

}
