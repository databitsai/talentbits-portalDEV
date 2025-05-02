import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Company } from 'src/app/_models/Company';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompanyApiService {

  pathModel = 'company';

  constructor(private readonly _http: HttpClient) { }
  findByAccountId(id: number): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findByAccountId`, request);
  }
  update(company: Company) {
    const request: RequestApi = new RequestApi(environment.origin, company);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update`, request);
  }
}