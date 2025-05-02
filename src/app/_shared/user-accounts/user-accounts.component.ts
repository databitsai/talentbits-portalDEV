import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { TokenClaims } from 'src/app/_models/TokenClaims';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { UserApiService } from 'src/app/_services/api/user-api.service';
import { AuthenticationService } from 'src/app/_services/security/authentication.service';
import { RoutesRolesService } from 'src/app/_services/security/routes-roles.service';
import { CATALOG_ACCESS, CATALOG_ACCOUNT_TYPES, CATALOG_SUBROLE } from 'src/app/_utils/constants';

@Component({
  selector: 'app-user-accounts',
  templateUrl: './user-accounts.component.html',
  styleUrls: ['./user-accounts.component.scss']
})
export class UserAccountsComponent implements OnInit {

  // variables
  claims!: TokenClaims;

  // data view
  sortOptions: any[] = [];
  sortOrder!: number;
  sortField!: string;
  sortKey!: any;
  // table
  items: any[] = [];
  // catalogs
  types: Catalog[] = [];
  accessTypes: Catalog[] = [];
  subroles: Catalog[] = [];

  constructor(private readonly _userApi: UserApiService,
    private _auth: AuthenticationService,
    private readonly _catalog: CatalogApiService,
    private _routesRoles: RoutesRolesService,
    private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.claims = this._auth.getTokenClaims();
    this.sortOptions = [
      { label: 'Fecha (más recientes)', value: '!createdAt' },
      { label: 'Fecha (más antiguos)', value: 'createdAt' }
    ];
    this.sortField = this.sortOptions[0].value;
    this.sortKey = this.sortField;
    this.spinner.show("load");
    this.loadCatalogs().pipe(
      tap((resp: any[]) => {
        this.types = resp[0];
        this.accessTypes = resp[1];
        this.subroles = resp[2];
      }),
      mergeMap((resp: any) => this._userApi.findRegistrationsByMembership(this.claims.memberid) )
    )
    .subscribe((resp: ResponseApi) => {
      const accounts: any[] = this.transformItemsToTableFormat(resp.result);
      this.items = accounts;
      this.spinner.hide("load");
    }, err => {
      console.log(err);
      this.spinner.hide("load");
    });
  }
  loadCatalogs(): Observable<any> {
    const accountTypesCatalog$ = this._catalog.findAllByType(CATALOG_ACCOUNT_TYPES).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const accessCatalog$ = this._catalog.findAllByType(CATALOG_ACCESS).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const subrolesCatalog$ = this._catalog.findAllByType(CATALOG_SUBROLE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(accountTypesCatalog$,  accessCatalog$, subrolesCatalog$);
  }
  // data view
  onSortChange(event: any) {
    let value = event.value;
    if (value.indexOf('!') === 0) {
      this.sortOrder = -1;
      this.sortField = value.substring(1, value.length);
    }
    else {
      this.sortOrder = 1;
      this.sortField = value;
    }
  }
  getTypeAccount(code: number): any {
    return this.types.find(i => i.code == code)?.label ?? 'ND';
  }
  getAccessLabel(value: string) {
    return this.accessTypes.find(i => i.value == value)?.label ?? 'ND';
  }
  getSubroleLabel(value: string) {
    return this.subroles.find(i => i.value == value)?.label ?? 'ND';
  }
  active(item: any) {
    if (!item.active) {
      this.spinner.show("load");
      this._userApi.activeRegistrationMembership(item.id, item.idMembership)
      .pipe(
        tap((resp: ResponseApi) => {
          const accounts: any[] = this.transformItemsToTableFormat(resp.result);
          this.items = [...accounts];
        }),
        mergeMap((resp: ResponseApi) => this._auth.refreshToken()),
        mergeMap((resp: any) => {
          this.claims = this._auth.getTokenClaims();
          return this._routesRoles.setRoleObjects(this.claims, item.access);
        })
      )
      .subscribe((resp: any) => {
        this.spinner.hide("load");
      }, err => {
        this.spinner.hide("load");
        console.log(err);
      });
    }
  }
  transformItemsToTableFormat(list: any): any[] {
    const accounts: any[] = list.map((item: any) => {
      return {
        id: item.id,
        account: item.membership.account.description ?? 'ND',
        type: item.membership.account.type ?? null,
        access: item.role.name ?? 'ND',
        role: item.membership.role.name ?? 'ND',
        createdAt: item.createdAt ? new Date(item.createdAt) : 'ND',
        active: item.isActive ?? false,
        idMembership: item.membership.id ?? null,
      };
    });
    return accounts;
  }
  get allItemsActive() {
    return this.items.every(i => i.active);
  }

}
