import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogApiService {

  pathModel = 'catalog';

  constructor(private readonly _http: HttpClient) { }
  findAllByType(type: string): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, { type });
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findAllByType`, request);
  }
}
