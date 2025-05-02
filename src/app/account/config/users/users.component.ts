import { Component, OnDestroy, OnInit } from '@angular/core';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { delay, map, mergeMap, tap } from 'rxjs/operators';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import {
  ACCOUNT_SELECTED_ROUTE,
  CATALOG_SUBROLE,
  PATTERN_EMAIL,
  PATTERN_NAMES,
  PATTERN_PASSWORD,
  PATTERN_PHONE,
  STORAGE_LOCAL
} from 'src/app/_utils/constants';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Catalog } from 'src/app/_models/Catalog';
import { PlanApiService } from 'src/app/_services/api/plan-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { ConfirmationService } from 'primeng/api';
import { StorageService } from 'src/app/_services/security/storage.service';
import { UserApiService } from 'src/app/_services/api/user-api.service';
import { UserAccount } from 'src/app/_models/UserAccount';
import { AccountResume } from 'src/app/_models/Account';
import { MatStepper } from '@angular/material/stepper';
import { NgxSpinnerService } from 'ngx-spinner';
import { MembershipApiService } from 'src/app/_services/api/membership-api.service';
import { UserApp } from 'src/app/_models/UserApp';
import { Membership } from 'src/app/_models/Membership';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit, OnDestroy {
  // table
  itemDialog!: boolean;
  itemMembership!: boolean;
  items: UserAccount[] = [];
  item!: UserAccount;
  selectedItems: UserAccount[] = [];
  submitted: boolean = false;
  // catalogs
  subroles: Catalog[] = [];
  // forms
  checkUserForm!: FormGroup;
  accessForm!: FormGroup;
  userForm!: FormGroup;
  // variables
  subroleSelectedValue!: string;
  showUserForm = false;
  patternPassword = PATTERN_PASSWORD;
  accountSelected: AccountResume = Object.create({});

  constructor(
    private readonly _catalog: CatalogApiService,
    private fb: FormBuilder,
    private _planApi: PlanApiService,
    private _usersApi: UserApiService,
    private _membershipApi: MembershipApiService,
    private toast: CustomToastService,
    private confirmationService: ConfirmationService,
    private readonly _storage: StorageService,
    private spinner: NgxSpinnerService
  ) { }

  ngOnInit(): void {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
    this.checkUserForm = this.fb.group({
      username: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_EMAIL)])],
      idAccount: [this.accountSelected.id]
    });
    this.accessForm = this.fb.group({
      role: ['', Validators.required],
      job: ['', Validators.compose([Validators.maxLength(45)])]
    });
    this.userForm = this.fb.group({
      id: [],
      password: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_PASSWORD)])],
      firstName: ['', Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
      lastName: ['', Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
      dni: ['', Validators.compose([Validators.required, Validators.maxLength(45)])],
      phone: ['', Validators.compose([Validators.maxLength(45), Validators.pattern(PATTERN_PHONE)])]
    });
    this.spinner.show("load");
    this.loadCatalogs()
      .pipe(
        tap((catalogs: any[]) => {
          this.subroles = catalogs[0];
        }),
        mergeMap((resp: any[]) =>
          this._usersApi
            .findAllByAccount(this.accountSelected.id)
            .pipe(
              mergeMap((response: ResponseApi) =>
                iif(
                  () => response.status === 'OK',
                  of(response.result),
                  throwError(response.message)
                )
              )
            )
        )
      )
      .subscribe(
        (list: UserAccount[]) => {
          this.items = list;
          this.spinner.hide("load");
        },
        (err) => {
          this.toast.addPrimeToast('error', '', err.error.message);
          this.spinner.hide("load");
        }
      );
  }
  loadCatalogs(): Observable<any> {
    const subrolesCatalog$ = this._catalog.findAllByType(CATALOG_SUBROLE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK',of(response.result),throwError(response.message)))
    );
    return zip(subrolesCatalog$);
  }
  // Table CRUD
  saveItem() {
    if (!this.showUserForm && this.checkUserForm.valid) {
      const request: any = {
        ...this.checkUserForm.value,
        ...this.accessForm.value,
        exist: !this.showUserForm,
        username: this.checkUserForm.get('username')?.value
      };
      this.saveItemOnDb(request, this.submitted);
    }
    if (this.showUserForm && this.checkUserForm.valid && this.userForm.valid) {
      const request: any = {
        ...this.checkUserForm.value,
        ...this.userForm.value,
        ...this.accessForm.value,
        exist: !this.showUserForm,
        username: this.checkUserForm.get('username')?.value
      };
      this.saveItemOnDb(request, this.submitted);
    }
    // this.validateAllFormFields(this.planForm);
  }
  saveItemOnDb(item: any, submitted: boolean) {
    console.log(item);
    const save$ = this._usersApi.createUserAccount(item);
    const update$ = this._planApi.update(item);

    const request$ = !submitted ? save$ : update$;
    this.spinner.show("save");
    request$.subscribe(
      (resp: ResponseApi) => {
        this.item = resp.result;
        this.hideDialog();
        if (!submitted) {
          this.items.push(this.item);
        } else {
          console.log(resp);
          this.items[this.findIndexById(this.item.id)] = this.item;
        }
        this.items = [...this.items];
        this.item = Object.create({});
        this.toast.addPrimeToast('success', '', resp.message);
        this.spinner.hide("save");
      },
      (err) => {
        console.log(err);
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      },
      () => { }
    );
  }
  editItem(item: UserAccount) {
    this.submitted = true;
    this.item = { ...item };
    const getUser$ = this._usersApi.fetchFromMembership(item.id).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(<UserApp>resp.result), throwError(resp)) )
    );
    const getMembership$ = this._membershipApi.findById(item.id).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(<Membership>resp.result), throwError(resp)) )
    );
    this.spinner.show("load");
    zip(getUser$, getMembership$)
    .subscribe((resp: any[]) => {
      const user: UserApp  = resp[0];
      const membership: Membership = resp[1];
      this.userForm.get('id')?.setValue(user.id);
      this.userForm.get('firstName')?.setValue(user.firstName);
      this.userForm.get('lastName')?.setValue(user.lastName);
      this.userForm.get('dni')?.setValue(user.dni);
      this.userForm.get('phone')?.setValue(user.phone);
      this.userForm.get('password')?.setValue('As123abcd'); // any

      this.accessForm.get('role')?.setValue(membership.role);
      this.accessForm.get('job')?.setValue(membership.job);
      this.subroleSelectedValue = membership.role;
      
      console.log(resp);
      this.itemMembership = true;
      this.spinner.hide("load");
    }, err => {
      console.log(err);
      this.spinner.hide("load");
    });
  }
  deleteItem(item: UserAccount) {
    this.confirmationService.confirm({
      message: '¿Estas seguro de eliminar la cuenta "' + item.name + '"?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show("load");
        this._membershipApi.delete(item.id)
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
              this.items = this.items.filter((val) => val.id !== item.id);
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
  // Screen controls
  openNew() {
    this.item = Object.create({});
    this.submitted = false;
    this.itemDialog = true;
  }
  hideDialog() {
    this.itemDialog = false;
    this.submitted = false;
    this.resetAllForms();
  }
  onHideCreate(event: any) {
    this.itemDialog = false;
    this.submitted = false;
    this.resetAllForms();
  }
  resetAllForms() {
    this.checkUserForm.reset();
    this.subroleSelectedValue = Object.create({});
    this.checkUserForm.get('username')?.enable();
    this.showUserForm = false;
    const accountSelected: AccountResume = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
    this.checkUserForm.get('idAccount')?.setValue(accountSelected.id);
    this.accessForm.reset();
    this.userForm.reset();
  }
  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].id === id) {
        index = i;
        break;
      }
    }

    return index;
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
  // For custom component
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
          name: `${resp.firstName ?? ''} ${resp.lastName ?? ''}`
        };
        this.items[this.findIndexById(this.item.id)] = this.item;
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
  editMembership() {
    if (this.accessForm.valid) {
      const request: any = {
        ...this.accessForm.value,
        id: this.item.id
      };
      this.spinner.show("save");
      this._membershipApi.update(request)
      .pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp), throwError(resp)) ),
        map((resp: ResponseApi) => {
          this.toast.addPrimeToast('success', '', resp.message);
          return resp.result;
        })
      )
      .subscribe((resp: Membership) => {
        this.item = {
          ...this.item,
          role: resp.role
        };
        this.items[this.findIndexById(this.item.id)] = this.item;
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
  goForward(stepper: MatStepper) {
    this.validateAllFormFields(this.checkUserForm);
    if (this.checkUserForm.valid) {
      this.spinner.show("load");
      this.checkUserForm.get('username')?.enable();
      this._usersApi.checkCreateUserCorporative(this.checkUserForm.value).pipe(
        tap(resp => this.showUserForm = !resp.result),
        delay(250)
      )
      .subscribe((resp: ResponseApi) => {
        console.log(resp);
        this.spinner.hide("load");
        this.checkUserForm.get('username')?.disable();
        stepper.next();
      }, err => {
        console.log(err);
        this.showUserForm = false;
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("load");
      });
    }
  }
  getRoleLabel(roleValue: string) {
    return this.subroles.find(i => i.value === roleValue)?.label;
  }
  // destroy
  ngOnDestroy(): void {
  }
}

