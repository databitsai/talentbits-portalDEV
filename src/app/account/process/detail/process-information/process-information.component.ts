import { Component, OnInit } from '@angular/core';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_PROCESS_STATE, CATALOG_PROJECT_TYPE, FORMAT_CALENDAR_DATE, HIRING_VALUE, PROCESS_SELECTED_ROUTE, STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED } from 'src/app/_utils/constants';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { Catalog } from 'src/app/_models/Catalog';
import { mergeMap } from 'rxjs/operators';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { StorageService } from 'src/app/_services/security/storage.service';
import { AccountResume } from 'src/app/_models/Account';
import { ProcessApiService } from 'src/app/_services/api/process-api.service';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { NgxSpinnerService } from 'ngx-spinner';
import { Plan } from 'src/app/_models/Plan';

@Component({
  selector: 'app-process-information',
  templateUrl: './process-information.component.html',
  styleUrls: ['./process-information.component.scss']
})
export class ProcessInformationComponent implements OnInit {

  // forms
  infoForm!: FormGroup;

  // variables
  accountSelected: AccountResume = Object.create({});
  processSelected: ProcessApp = Object.create({});
  type = '';
  minDateStart = new Date();
  minDateEnd = new Date();
  formatCalendarFormat = FORMAT_CALENDAR_DATE;
  typeSelected: any = '';
  showStatus = false;
  plan!: Plan;

  // catalogs
  types: any[] = [];
  states: Catalog[] = [];
 
  constructor(private fb: FormBuilder,
    private readonly _catalogAPi: CatalogApiService,
    private readonly _storage: StorageService,
    private readonly _processApi: ProcessApiService,
    private toast: CustomToastService,
    private spinner: NgxSpinnerService) {
      this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
      this.processSelected = this._storage.getObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
      this.typeSelected = this.processSelected.type;
      this.plan = this._storage.getObject(STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED);
    }

  ngOnInit(): void {
    this.infoForm = this.fb.group({
      id: [this.processSelected.id],
      type: [this.processSelected.type, Validators.compose([Validators.required])],
      name: [this.processSelected.name, Validators.compose([Validators.required, Validators.maxLength(150)])],
      validFrom: [new Date(this.processSelected.validFrom), Validators.compose([Validators.required])],
      validUntil: [new Date(this.processSelected.validUntil), Validators.compose([Validators.required])],
      description: [this.processSelected.description, Validators.compose([Validators.maxLength(350)])],
      status: [this.processSelected.status],
      account: this.fb.group({
        id: [this.accountSelected.id]
      })
    });
    this.infoForm.disable();
    this.spinner.show("load");
    this.loadCatalogs().subscribe((catalogs: [Catalog[], Catalog[]]) => {
      this.types = catalogs[0];
      this.types = this.types.map(i => {
        i.disabled = false;
        if (i.value === HIRING_VALUE && !this.plan.isPostVacancyActive) {
          i.disabled = true;
        }
        return i;
      });
      this.states = catalogs[1];
      this.infoForm.get('type')?.setValue(this.typeSelected);
      this.spinner.hide("load");
      this.showStatus = true;
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
  onStartDateChange(e: Date) {
    this.infoForm.get('validUntil')?.reset();
    this.minDateEnd = e;
  }
  save() {
    if (this.infoForm.valid) {
      this.spinner.show("save");
      this.showStatus = false;
      this._processApi.update(this.infoForm.value)
      .subscribe((resp: ResponseApi) => {
        this.infoForm.disable();
        this.toast.addPrimeToast('success', '', resp.message);
        this.spinner.hide("save");
        this.processSelected = resp.result;
        this._storage.createObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE, this.processSelected);
        this.typeSelected = this.processSelected.type;
        this.showStatus = true;
      }, err => {
        this.showStatus = true;
        this.spinner.hide("save");
        this.toast.addPrimeToast('error', '', err.error.message);
      });
    } else {
      this.validateAllFormFields(this.infoForm);
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
  onEditItem() {
    this.infoForm.enable();
  }
  onCancelEdit() {
    this.infoForm.get('id')?.setValue(this.processSelected.id);
    this.infoForm.get('type')?.setValue(this.processSelected.type);
    this.infoForm.get('name')?.setValue(this.processSelected.name);
    this.infoForm.get('validFrom')?.setValue(new Date(this.processSelected.validFrom));
    this.infoForm.get('validUntil')?.setValue(new Date(this.processSelected.validUntil));
    this.infoForm.get('description')?.setValue(this.processSelected.description);
    this.infoForm.get('status')?.setValue(this.processSelected.status);
    this.infoForm.get('account')?.get('id')?.setValue(this.accountSelected.id);
    this.typeSelected = this.processSelected.type;
    this.infoForm.disable();
  }
  getProcessStateLabel(code: number) {
    return this.states.find(i => i.code === code)?.label ?? 'NE';
  }
  getProcessStateValue(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'NE';
  }

}
