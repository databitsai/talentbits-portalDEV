import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Membership } from 'src/app/_models/Membership';
import { RequestApi } from 'src/app/_models/RequestApi';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MembershipApiService {

  pathModel = 'membership';

  constructor(private readonly _http: HttpClient) { }
  findById(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/findById`, request);
  }
  delete(id: number) {
    const request: RequestApi = new RequestApi(environment.origin, id);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/delete`, request);
  }
  update(membership: Membership) {
    const request: RequestApi = new RequestApi(environment.origin, membership);
    return this._http.post<ResponseApi>(`${environment.adminUrl}/${this.pathModel}/update`, request);
  }
}
