import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { TokenClaims } from 'src/app/_models/TokenClaims';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { UserProcessApiService } from 'src/app/_services/api/user-process-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { AuthenticationService } from 'src/app/_services/security/authentication.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { CATALOG_PROCESS_STATE, CATALOG_PROJECT_TYPE, PROCESS_USER_SELECTED_ROUTE, STORAGE_LOCAL } from 'src/app/_utils/constants';

@Component({
  selector: 'app-user-process-list',
  templateUrl: './user-process-list.component.html',
  styleUrls: ['./user-process-list.component.scss']
})
export class UserProcessListComponent implements OnInit {
  // variables
  items: ProcessApp[] = [];
  claims: TokenClaims = Object.create({});
  displayModal: boolean = false;
  companySelected!: any;
  // catalogs
  types: Catalog[] = [];
  states: Catalog[] = [];
  constructor(private readonly _catalogAPi: CatalogApiService,
    private _storage: StorageService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private _userProcessApi: UserProcessApiService,
    private _auth: AuthenticationService) {
      this.claims = this._auth.getTokenClaims();
    }

  ngOnInit(): void {
    this._storage.deleteKey(STORAGE_LOCAL, PROCESS_USER_SELECTED_ROUTE);
    this.spinner.show("load");
    this.loadCatalogs().pipe(
      tap((catalogs: [Catalog[], Catalog[]]) => {
        this.types = catalogs[0];
        this.states = catalogs[1];
      }),
      mergeMap((resp: any) => this._userProcessApi.findByMembership(this.claims.memberid)  ),
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)) ),
      map((resp: any[]) => resp.map((item: any) => {
        return {
          ...item.process,
          statusUserProcess: item.status ?? -1,
          idUserProcess: item.id,
          evaluations: item.countEvaluations ?? 0,
          countFinishedEvaluations: item.countFinishedEvaluations ?? 0
        };
      }))
    )
    .subscribe((resp: any[]) => {
      this.items = resp;
      this.spinner.hide("load");
    }, err => {
      this.spinner.hide("load");
    });
  }
  loadCatalogs(): Observable<any> {
    const getTypes$ = this._catalogAPi.findAllByType(CATALOG_PROJECT_TYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const getStates$ = this._catalogAPi.findAllByType(CATALOG_PROCESS_STATE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getTypes$, getStates$);
  }
  getProcessTypeLabel(code: number) {
    return this.types.find(i => i.code === code)?.label ?? 'NE';
  }
  getProcessStateLabel(code: number) {
    return this.states.find(i => i.code === code)?.label ?? 'NE';
  }
  getProcessStateValue(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'NE';
  }
  openProcess(item: ProcessApp) {
    this._storage.createObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_ROUTE, item);
    this.router.navigate(['/user/process/evaluations']);
  }
  showModalDialog(account: any) {
    if (account !== undefined) {
      if (account.company !== undefined) {
        this.companySelected = account.company;
        this.displayModal = true;
      }
    }
    
  }

}
