import { Injectable } from '@angular/core';
import { iif, Observable, of, throwError } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { TokenClaims } from 'src/app/_models/TokenClaims';
import { ACCOUNT_SELECTED_ROUTE, ROLE_ACCESS_ADMIN, ROLE_ACCESS_CORP, ROLE_ACCESS_USER, STORAGE_LOCAL } from 'src/app/_utils/constants';
import { AccountApiService } from '../api/account-api.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class RoutesRolesService {

  constructor(private readonly _accountApi: AccountApiService,
    private readonly _storage: StorageService) { }
  getAccessRoute(roleAccess: string) {
    let result = '/authentication';
    if (roleAccess === ROLE_ACCESS_ADMIN) {
      result = '/admin';
    }
    if (roleAccess === ROLE_ACCESS_CORP) {
      result = '/account';
    }
    if (roleAccess === ROLE_ACCESS_USER) {
      result = '/user';
    }
    return result;
  }
  setRoleObjects(claims: TokenClaims, roleAccess: string): Observable<any> {
    if (roleAccess === ROLE_ACCESS_CORP) {
      return this._accountApi.findCorporativeByMembership(claims.memberid).pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)) ),
        tap((account: AccountResume) => {
          const cut = 25;
          const name = account.account?.length < cut ? account.account : `${account.account.substring(0, cut)}...`;
          this._storage.deleteKey(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
          this._storage.createObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE, { account: name, id: account.id, type: account.type });
        })
      );
    }
    if (roleAccess ===  ROLE_ACCESS_USER) {
      return this._accountApi.findIndividualByMembership(claims.memberid).pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)) ),
        tap((account: AccountResume) => {
          const cut = 25;
          const name = account.account?.length < cut ? account.account : `${account.account.substring(0, cut)}...`;
          this._storage.deleteKey(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
          this._storage.createObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE, { account: name, id: account.id, type: account.type });
        })
      );
    }
    if (roleAccess === ROLE_ACCESS_ADMIN) {
      this._storage.deleteKey(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
      this._storage.createObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE, null);
      return of(null);
    }
    return of();
  }
}
