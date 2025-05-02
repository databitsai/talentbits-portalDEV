import { Component, OnInit } from '@angular/core';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { Catalog } from 'src/app/_models/Catalog';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { CATALOG_CURRENCY_TYPE, CATALOG_WORKING_DAY, CATALOG_MOBILITY, CATALOG_VACCANT_STATE, STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE, CATALOG_COUNTRIES, CATALOG_INDUSTRY_SECTOR, VACANT_SELECTED_ROUTE, STORAGE_PLAN_ACCOUNT_SELECTED, FORMAT_CALENDAR_DATE } from 'src/app/_utils/constants';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { Company } from 'src/app/_models/Company';
import { CompanyApiService } from 'src/app/_services/api/company-api.service';
import { VaccantApiService } from 'src/app/_services/api/vaccant-api.service';
import { Vaccant } from 'src/app/_models/Vaccant';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { Plan } from 'src/app/_models/Plan';

@Component({
  selector: 'app-vaccant-detail',
  templateUrl: './vaccant-detail.component.html',
})
export class VaccantDetailComponent implements OnInit {

  // catalogs
  currencyType: Catalog[] = [];
  workingDay: Catalog[] = [];
  mobility: Catalog[] = [];
  statusVaccant: Catalog[] = [];
  country: Catalog[] = [];
  industrySector: Catalog[] = [];

  itemQuestionDialog!: boolean;
  items: Vaccant[] = [];
  item!: Vaccant;

  // forms
  checkDetailForm!: FormGroup;

  // variables
  responsabilitiesContentContainer: string = '';
  knowledgeContentContainer: string = '';
  mobilityType: any;
  submitted: boolean = false;
  idVaccant!: any;

  accountSelected: AccountResume = Object.create({});
  company: Company = Object.create({});
  vaccantSelected: Vaccant = Object.create({});
  planSelected: Plan =  Object.create(null);

  isPublic: any = 0;
  categoriesVacantIsOpen: any[] = [{ name: 'Si', code: 1 }, { name: 'No', code: 0 }];

  isOutstanding: any = 0;
  categoriesVacantIsoutstanding: any[] = [{ name: 'Si', code: 1 }, { name: 'No', code: 0 }];
  isOutstandingVaccantDisabled = true;

  minDateStart = new Date();
  minDateEnd = new Date();

  formatCalendarFormat = FORMAT_CALENDAR_DATE;

  constructor(
    private fb: FormBuilder,
    private toast: CustomToastService,
    private readonly _storage: StorageService,
    private readonly _catalogAPi: CatalogApiService,
    private readonly _companyApi: CompanyApiService,
    private _vaccantApi: VaccantApiService,
    private _router: Router,
    private spinner: NgxSpinnerService
  ) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
    this.vaccantSelected = this._storage.getObject(STORAGE_LOCAL, VACANT_SELECTED_ROUTE);
    this.planSelected = this._storage.getObject(STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED);
  }

  ngOnInit(): void {
    this.idVaccant = this.vaccantSelected !== null ? this.vaccantSelected.id : -1;
    if (this.idVaccant !== -1) {
      this.submitted = true;
    }
    if(this.planSelected !== null){
      this.isOutstandingVaccantDisabled = !this.planSelected.isHighlightVacancyActive;
    }
    this.checkDetailForm = this.fb.group({
      title: ['', Validators.required],
      yearsExperience: [0, Validators.required],
      workingDayType: ['', Validators.required],
      currencyType: ['', Validators.required],
      salary: ['', Validators.required],
      responsabilitiesContent: ['', Validators.required],
      knowledgeContent: ['', Validators.required],
      extraPointsDescription: ['', Validators.required],
      mobilityType: ['', Validators.required],
      isPublic: [1, Validators.required],
      isOutstanding: [0, Validators.required],
      idAccount: [this.accountSelected.id],
      validFrom: [this.minDateStart, Validators.compose([Validators.required])],
      validUntil: ['', Validators.compose([Validators.required])],
      id: [this.idVaccant],

    });
    this.spinner.show("load");
    this.loadCatalogs()
    .pipe(
      tap((catalogs: any[]) => {
        this.currencyType = catalogs[0];
        this.workingDay = catalogs[1];
        this.mobility = catalogs[2];
        this.statusVaccant = catalogs[3];
        this.country = catalogs[4];
        this.industrySector = catalogs[5];
        this.company = catalogs[6];
      }),
      mergeMap((resp: any) => iif(() => this.idVaccant !== -1, of(this.vaccantSelected), of(this.vaccantSelected)) )
    )
      .subscribe((vaccant: any) => {
        this.isPublic = 1;
        if (vaccant !== null) {
          this.checkDetailForm.get('title')?.setValue(vaccant.title);
          this.checkDetailForm.get('yearsExperience')?.setValue(vaccant.yearsExperience);
          this.checkDetailForm.get('workingDayType')?.setValue(vaccant.workingDayType);
          this.checkDetailForm.get('currencyType')?.setValue(vaccant.currencyType);
          this.checkDetailForm.get('salary')?.setValue(vaccant.salary);
          this.checkDetailForm.get('responsabilitiesContent')?.setValue(vaccant.responsabilitiesContent);
          this.checkDetailForm.get('knowledgeContent')?.setValue(vaccant.knowledgeContent);
          this.checkDetailForm.get('extraPointsDescription')?.setValue(vaccant.extraPointsDescription);
          this.checkDetailForm.get('mobilityType')?.setValue(vaccant.mobilityType);
          this.checkDetailForm.get('isPublic')?.setValue(vaccant.isPublic);
          this.checkDetailForm.get('isOutstanding')?.setValue(vaccant.isOutstanding);
          this.checkDetailForm.get('validFrom')?.setValue(vaccant.validFrom ? new Date(vaccant.validFrom) :  null);
          this.checkDetailForm.get('validUntil')?.setValue(vaccant.validUntil ? new Date(vaccant.validUntil) :  null);
          this.mobilityType = vaccant.mobilityType;
          this.isPublic = vaccant.isPublic;
          this.isOutstanding = vaccant.isOutstanding;
        }
        
        this.spinner.hide("load");
        }, (err) => {
          this.toast.addPrimeToast('error', '', err.error.message);
          this.spinner.hide("load");
        }
      );

  };

  loadCatalogs(): Observable<any> {
    const currencyTypeCatalog$ = this._catalogAPi.findAllByType(CATALOG_CURRENCY_TYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const workingDayCatalog$ = this._catalogAPi.findAllByType(CATALOG_WORKING_DAY).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const mobilityCatalog$ = this._catalogAPi.findAllByType(CATALOG_MOBILITY).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const vaccantStateCatalog$ = this._catalogAPi.findAllByType(CATALOG_VACCANT_STATE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );

    const countryCatalog$ = this._catalogAPi.findAllByType(CATALOG_COUNTRIES).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const industrySectorCatalog$ = this._catalogAPi.findAllByType(CATALOG_INDUSTRY_SECTOR).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const companyCatalog$ = this._companyApi.findByAccountId(this.accountSelected.id).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );

    return zip(currencyTypeCatalog$, workingDayCatalog$, mobilityCatalog$, vaccantStateCatalog$, countryCatalog$, industrySectorCatalog$, companyCatalog$);
  }

  saveItemOnSessionStorage() {
    if (
      this.checkDetailForm.get('title')?.value === "" ||
      this.checkDetailForm.get('yearsExperience')?.value === "" ||
      this.checkDetailForm.get('workingDayType')?.value === "" ||
      this.checkDetailForm.get('currencyType')?.value === "" ||
      this.checkDetailForm.get('salary')?.value === "" ||
      this.checkDetailForm.get('responsabilitiesContent')?.value === "" ||
      this.checkDetailForm.get('knowledgeContent')?.value === "" ||
      this.checkDetailForm.get('extraPointsDescription')?.value === "" ||
      this.checkDetailForm.get('typeSelected')?.value === "" ||
      this.checkDetailForm.get('selectedCategoryVaccantIsOpen')?.value === "" ||
      this.checkDetailForm.get('selectedCategoryVaccantIsoutstanding')?.value === ""
    ) {
      this.toast.addPrimeToast('info', '', 'Debe completar los campos requeridos antes de guardar la vacante');
      return;
    }

    if (this.checkDetailForm.valid) {
      this._storage.createObject(STORAGE_LOCAL, VACANT_SELECTED_ROUTE, this.checkDetailForm.value);
      this.openPage('/account/vaccant/item/resume');
    } else {
      this.validateAllFormFields(this.checkDetailForm);
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

  openPage(pageUrl: string) {
    this._router.navigate([pageUrl]);
  }

  getIndustrySector(value: any) {
    return this.industrySector.find(i => i.value === value)?.label ?? 'NE';
  }

  getCountry(value: any) {
    return this.country.find(i => i.code === value)?.label ?? 'NE';
  }

  onStartDateChange(e: Date) {
    this.checkDetailForm.get('validUntil')?.reset();
    this.minDateEnd = e;
  }

}
