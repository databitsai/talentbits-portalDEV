import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { map, mergeMap, tap } from 'rxjs/operators';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_ACCOUNT_TYPES, CATALOG_SUBROLE, PATTERN_NAMES, PATTERN_PASSWORD, ROLE_ACCESS_ADMIN, ROLE_ACCESS_CORP, ROLE_ACCESS_USER, ROLE_ACCOUNT_EDITOR, ROLE_ACCOUNT_OWNER, ROUTEPARAM_ADMIN_ADMININSTRATOR, ROUTEPARAM_ADMIN_CORPORATIVE, STORAGE_LOCAL, TOKEN_INFO_ACCESS } from 'src/app/_utils/constants';
import { Catalog } from 'src/app/_models/Catalog';
import { AccountApiService } from 'src/app/_services/api/account-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { AccountResume } from 'src/app/_models/Account';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from 'src/app/_services/security/storage.service';
import { Authority } from 'src/app/_models/Authority';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { UserApiService } from 'src/app/_services/api/user-api.service';
import { MembershipApiService } from 'src/app/_services/api/membership-api.service';
import { UserApp } from 'src/app/_models/UserApp';
import { Membership } from 'src/app/_models/Membership';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';

@Component({
  selector: 'app-account-list',
  templateUrl: './account-list.component.html',
  styleUrls: ['./account-list.component.scss']
})
export class AccountListComponent implements OnInit, OnDestroy {
  // inputs
  @Input() rolePath: string = '';
  // data view
  sortOptions: any[] = [];
  sortOrder!: number;
  sortField!: string;
  sortKey!: any;
  // table
  items: AccountResume[] = [];
  // catalogs
  types: Catalog[] = [];
  subroles: Catalog[] = [];
  // variables
  authorities: Authority[] = [];
  configurations = {
    owner: false,
    editor: false
  };
  showDialogEdit = false;
  subroleSelectedValue!: string;
  item!: AccountResume;
  // forms
  accessForm!: FormGroup;
  userForm!: FormGroup;

  constructor(
    private readonly _catalog: CatalogApiService,
    private _accountApi: AccountApiService,
    private toast: CustomToastService,
    private route: ActivatedRoute, private router: Router,
    private readonly _storage: StorageService,
    private fb: FormBuilder,
    private _usersApi: UserApiService,
    private _membershipApi: MembershipApiService,
    private spinner: NgxSpinnerService,
    private confirmationService: ConfirmationService) {
      this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
  }

  ngOnInit(): void {
    this.setConfigurations();

    this.accessForm = this.fb.group({
      id: [],
      role: ['', Validators.required]
    });
    this.userForm = this.fb.group({
      id: [],
      password: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_PASSWORD)])],
      firstName: ['', Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
      lastName: ['', Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
      dni: ['', Validators.compose([Validators.required, Validators.maxLength(45)])]
    });

    this._storage.deleteKey(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);

    this.rolePath = <string>this.route.snapshot.data['routeName'];

    this.loadCatalogs().pipe(
      tap((catalogs: any[]) => {
        this.types = catalogs[0];
        this.subroles = catalogs[1];
      }),
      mergeMap((resp: any) => this._accountApi.findAllByType(this.rolePath).pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)) )
      ))
    )
      .subscribe((accounts: AccountResume[]) => {
        this.items = accounts;
      }, err => {
        this.toast.addPrimeToast('error', '', err.message);
      });
    // data view
    this.sortOptions = [
      { label: 'Fecha (más recientes)', value: '!createdAt' },
      { label: 'Fecha (más antiguos)', value: 'createdAt' }
    ];
    this.sortField = this.sortOptions[0].value;
    this.sortKey = this.sortField;
  }
  loadCatalogs(): Observable<any> {
    const accountTypesCatalog$ = this._catalog.findAllByType(CATALOG_ACCOUNT_TYPES).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const subrolesCatalog$ = this._catalog.findAllByType(CATALOG_SUBROLE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK',of(response.result),throwError(response.message)))
    );
    return zip(accountTypesCatalog$, subrolesCatalog$);
  }
  // Screen controls
  openPage(pageUrl: string, account: AccountResume) {
    const cut = 25;
    const name = account.account?.length < cut ? account.account : `${account.account.substring(0, cut)}...`;
    this._storage.createObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE, { account: name, id: account.id, type: account.type });
    this.router.navigate([pageUrl]);
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
  // For custom component
  typeAccount(code: number): any {
    return this.types.find(i => i.code == code) !== undefined ? this.types.find(i => i.code === code) : '';
  }
  setConfigurations() {
    if (this.authorities.map(i => i.authority).includes(ROLE_ACCOUNT_OWNER)) {
      this.configurations.owner = true;
      this.configurations.editor = false;
    }
    if (this.authorities.map(i => i.authority).includes(ROLE_ACCOUNT_EDITOR)) {
      this.configurations.owner = false;
      this.configurations.editor = true;
    }
  }
  get isCorporativePath() {
    return this.rolePath === ROUTEPARAM_ADMIN_CORPORATIVE;
  }
  get isAdministratorPath() {
    return this.rolePath === ROUTEPARAM_ADMIN_ADMININSTRATOR;
  }
  openEditItem(item: AccountResume) {
    const getUser$ = this._usersApi.fetchFromMembership(item.idMembership).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(<UserApp>resp.result), throwError(resp)) )
    );
    const getMembership$ = this._membershipApi.findById(item.idMembership).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(<Membership>resp.result), throwError(resp)) )
    );
    this.spinner.show("load");
    zip(getUser$, getMembership$)
    .subscribe((resp: any[]) => {
      this.item = item;
      const user: UserApp  = resp[0];
      const membership: Membership = resp[1];
      this.userForm.get('id')?.setValue(user.id);
      this.userForm.get('firstName')?.setValue(user.firstName);
      this.userForm.get('lastName')?.setValue(user.lastName);
      this.userForm.get('dni')?.setValue(user.dni);
      this.userForm.get('password')?.setValue('As123abcd'); // any

      this.accessForm.get('role')?.setValue(membership.role);
      this.accessForm.get('id')?.setValue(membership.id);
      this.subroleSelectedValue = membership.role;
      
      this.showDialogEdit = true;
      this.spinner.hide("load");
    }, err => {
      console.log(err);
      this.spinner.hide("load");
    });
  }
  deleteItem(item: AccountResume) {
    console.log(item);
    this.confirmationService.confirm({
      message: '¿Estas seguro de eliminar la cuenta "' + item.owner + '"?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show("load");
        this._membershipApi.delete(item.idMembership)
          .pipe(
            mergeMap((response: ResponseApi) =>
              iif(
                () => response.status === 'OK',
                of(response),
                throwError(response.message)
              )
            )
          )
          .subscribe(
            (resp: any) => {
              this.items = this.items.filter((val) => val.idMembership !== item.idMembership);
              this.item = Object.create({});
              this.toast.addPrimeToast('success', '', resp.message);
              this.spinner.hide("load");
            },
            (err) => {
              console.log(err);
              this.toast.addPrimeToast('error', '', err.error.message);
              this.spinner.hide("load");
            }
          );
      },
    });
  }
  onHideCreate(event: any) {
    this.resetAllForms();
  }
  resetAllForms() {
    this.subroleSelectedValue = Object.create({});
    this.accessForm.reset();
    this.userForm.reset();
  }
  editMembership() {
    if (this.accessForm.valid) {
      this.spinner.show("save");
      this._membershipApi.update(this.accessForm.value)
      .pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp), throwError(resp)) ),
        map((resp: ResponseApi) => {
          this.toast.addPrimeToast('success', '', resp.message);
          return resp.result;
        })
      )
      .subscribe((resp: Membership) => {
        console.log(resp);
        this.item = {
          ...this.item,
          subrole: resp.role
        };
        this.items[this.findIndexByIdMembership(this.item.idMembership)] = this.item;
        this.items = [...this.items];
        this.spinner.hide("save");
      }, err => {
        console.log(err);
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      });
    } else {
      this.validateAllFormFields(this.accessForm);
    }
  }
  editUser() {
    if (this.userForm.valid) {
      this.spinner.show("save");
      this._usersApi.update(this.userForm.value)
      .pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp), throwError(resp)) ),
        map((resp: ResponseApi) => {
          this.toast.addPrimeToast('success', '', resp.message);
          return resp.result;
        })
      )
      .subscribe((resp: UserApp) => {
        this.item = {
          ...this.item,
          owner: `${resp.firstName ?? ''} ${resp.lastName ?? ''}`
        };
        this.items[this.findIndexByIdMembership(this.item.idMembership)] = this.item;
        this.items = [...this.items];
        this.spinner.hide("save");
      }, err => {
        console.log(err);
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      });
    } else {
      this.validateAllFormFields(this.userForm);
    }
  }
  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }
  findIndexByIdMembership(id: number): number {
    let index = -1;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].idMembership === id) {
        index = i;
        break;
      }
    }
    return index;
  }
  getSubroleLabelByValue(value: string): string {
    return this.subroles.find(i => i.value === value)?.label ?? 'ND';
  }
  // destroy
  ngOnDestroy(): void {
  }

}
