import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { Catalog } from 'src/app/_models/Catalog';
import { Plan } from 'src/app/_models/Plan';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { Vaccant } from 'src/app/_models/Vaccant';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { ProcessApiService } from 'src/app/_services/api/process-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_PROCESS_STATE, CATALOG_PROJECT_TYPE, FORMAT_CALENDAR_DATE, HIRING_VALUE, PROCESS_SELECTED_ROUTE, STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED, VACANT_SELECTED_ROUTE } from 'src/app/_utils/constants';

@Component({
  selector: 'app-process-list',
  templateUrl: './process-list.component.html',
  styleUrls: ['./process-list.component.scss']
})
export class ProcessListComponent implements OnInit {
  // variables
  items: ProcessApp[] = [];
  accountSelected: AccountResume = Object.create({});
  itemDialog!: boolean;
  type = '';
  minDateStart = new Date();
  minDateEnd = new Date();
  formatCalendarFormat = FORMAT_CALENDAR_DATE;
  typeSelected: any = '';
  item!: ProcessApp;
  rowTableSelected!: any;
  vaccantSelected!: Vaccant;
  plan!: Plan;

  // catalogs
  types: any[] = [];
  states: Catalog[] = [];

  // form
  createForm!: FormGroup;

  constructor(private readonly _processApi: ProcessApiService,
    private _storage: StorageService,
    private fb: FormBuilder,
    private readonly _catalogAPi: CatalogApiService,
    private toast: CustomToastService,
    private spinner: NgxSpinnerService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private route: ActivatedRoute) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
    this.plan = this._storage.getObject(STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED);
  }

  ngOnInit(): void {
    this._storage.deleteKey(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
    this.createForm = this.fb.group({
      type: ['', Validators.compose([Validators.required])],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      validFrom: [this.minDateStart, Validators.compose([Validators.required])],
      validUntil: ['', Validators.compose([Validators.required])],
      description: ['', Validators.compose([Validators.required, Validators.maxLength(350)])],
      account: this.fb.group({
        id: [this.accountSelected.id, Validators.required]
      })
    });
    this.spinner.show("load");
    this.loadCatalogs().pipe(
      tap((catalogs: [Catalog[], Catalog[]]) => {
        this.types = catalogs[0];
        this.states = catalogs[1];
        this.typeSelected = this.types[0].code ?? null;
        this.createForm.get('type')?.setValue(this.typeSelected);
        this.types = this.types.map(i => {
          i.disabled = false;
          if (i.value === HIRING_VALUE && !this.plan.isPostVacancyActive) {
            i.disabled = true;
          }
          return i;
        });
      }),
      mergeMap((resp: any) => this.route.paramMap),
      tap((params: ParamMap) => {
        // case: route from vaccant
        const action: string | null= params.get('action');
        if (action === 'create-from-vaccant'){
          this.vaccantSelected = this._storage.getObject(STORAGE_LOCAL, VACANT_SELECTED_ROUTE);
          this.openNew();
        }
      }),
      mergeMap((resp: any) => this._processApi.findByAccount(this.accountSelected.id))
    )
    .subscribe((resp: ResponseApi) => {
      this.items = resp.result;
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
  onRowSelect(event: any) {
    this.openParticipants(event.data);
  }
  openNew() {
    this.item = Object.create({});
    this.createForm.reset();
    this.typeSelected = this.types[0].code ?? null;
    this.createForm.get('type')?.setValue(this.typeSelected);
    this.createForm.get('account')?.get('id')?.setValue(this.accountSelected.id);
    this.itemDialog = true;
  }
  onHideCreate(ev: any) {
    this.itemDialog = false;
    this.resetAllForms();
  }
  resetAllForms() {
    this.createForm.reset();
    this.createForm.get('account')?.get('id')?.setValue(this.accountSelected.id);
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
  onStartDateChange(e: Date) {
    this.createForm.get('validUntil')?.reset();
    this.minDateEnd = e;
  }
  saveItem() {
    console.log(this.createForm.value, this.createForm.valid);
    if (this.createForm.valid) {
      this.spinner.show("save");
      this._processApi.create(this.createForm.value)
      .subscribe((resp: ResponseApi) => {
        this.toast.addPrimeToast('success', '', resp.message);
        this.spinner.hide("save");
        this.openProcess(resp.result);
      }, err => {
        console.log(err);
        this.spinner.hide("save");
        this.toast.addPrimeToast('error', '', err.error.message);
      });
    } else {
      this.validateAllFormFields(this.createForm);
    }
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
    this._storage.createObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE, item);
    this.router.navigate(['/account/process/item/detail']);
  }
  openParticipants(item: ProcessApp) {
    this._storage.createObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE, item);
    this.router.navigate(['/account/process/item/requests']);
  }
  openReports(item: ProcessApp) {
    this._storage.createObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE, item);
    this.router.navigate(['/account/process/reports']);
  }
  delete(item: any) {
    this.confirmationService.confirm({
      message: '¿Esta seguro de eliminar el proceso"' + item.name + '"?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show("load");
        this._processApi.disable(item.id)
          .subscribe((resp: ResponseApi) => {
            this.items = this.items.filter(val => val.id !== item.id);
            this.item = Object.create({});
            this.toast.addPrimeToast('success', '', resp.message);
            this.spinner.hide("load");
          }, err => {
            console.log(err);
            this.toast.addPrimeToast('error', '', err.error.message);
            this.spinner.hide("load");
          });
      }
    });
  }
}
