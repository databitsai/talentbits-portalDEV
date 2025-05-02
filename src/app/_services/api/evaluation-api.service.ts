import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EvaluationApiService {

  pathModel = 'evaluation';

  constructor(private readonly _http: HttpClient) { }

  findById(id: number): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findById`, request);
  }

  findAllEvaluation(): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, {});
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findAllEvaluation`, request);
  }

  create(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/create`, request);
  }

  update(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update`, request);
  }

  delete(id: number): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/delete`, request);
  }
}
