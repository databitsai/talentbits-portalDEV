import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class QuoteApiService {

  pathModel = 'quote';

  constructor(private readonly _http: HttpClient) { }

  fetchProcessRequestCurrentMonthQuote(account: any): Observable<ResponseApi> {
    const request: RequestApi = new RequestApi(environment.origin, account);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/fetchProcessRequestCurrentMonthQuote`, request);
  }
}
