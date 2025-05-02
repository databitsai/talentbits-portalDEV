import { Component, Input, OnInit } from '@angular/core';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { StorageService } from 'src/app/_services/security/storage.service';
import { CATALOG_CURRENCY_TYPE, CATALOG_WORKING_DAY, CATALOG_MOBILITY, CATALOG_VACCANT_STATE, STORAGE_LOCAL, CATALOG_COUNTRIES, CATALOG_INDUSTRY_SECTOR, ACCOUNT_SELECTED_ROUTE, VACANT_SELECTED_ROUTE} from 'src/app/_utils/constants';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { mergeMap } from 'rxjs/operators';
import { Vaccant } from 'src/app/_models/Vaccant';
import { Catalog } from 'src/app/_models/Catalog';
import { AccountResume } from 'src/app/_models/Account';
import { Company } from 'src/app/_models/Company';
import { CompanyApiService } from 'src/app/_services/api/company-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { Router } from '@angular/router';
import { VaccantApiService } from 'src/app/_services/api/vaccant-api.service';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-vaccant-resume',
  templateUrl: './vaccant-resume.component.html',
})
export class VaccantResumeComponent implements OnInit {

  // variables
  loading = false;
  vaccantSelected: Vaccant = Object.create({});
  accountSelected: AccountResume = Object.create({});
  company: Company = Object.create({});
  typeSelected: any = '';

  isPublic: any = '';
  categoriesVacantIsOpen: any[] = [{name: 'Si', code: 1}, {name: 'No', code: 0}];

  isOutstanding: any = '';
  categoriesVacantIsoutstanding: any[] = [{name: 'Si', code: 1}, {name: 'No', code: 0}];

  
  //catalogs
  currencyType: Catalog[] = [];
  workingDay: Catalog[] = [];
  mobility: Catalog[] = [];
  statusVaccant: Catalog[] = [];
  infoCompany: Company[]=[];
  country: Catalog[]=[];
  industrySector: Catalog[]=[];

  submitted = false;

  constructor(
    private readonly _storage: StorageService,
    private readonly _catalogAPi: CatalogApiService,
    private readonly _companyApi: CompanyApiService,
    private toast: CustomToastService,
    private _router: Router,
    private _vaccantApi: VaccantApiService,
    private spinner: NgxSpinnerService
  ) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
  }

  ngOnInit(): void {
    this.vaccantSelected= this._storage.getObject(STORAGE_LOCAL, VACANT_SELECTED_ROUTE);

    if (this.vaccantSelected.id !== -1) {
      this.submitted = true;
    } else {
      delete this.vaccantSelected.id;
    }
    this.spinner.show("load");
    this.loadCatalogs()
      .subscribe((catalogs: any[]) => {
          this.currencyType = catalogs[0];
          this.workingDay = catalogs[1];
          this.mobility = catalogs[2];
          this.statusVaccant = catalogs[3];
          this.country = catalogs[4];
          this.industrySector = catalogs[5];
          this.company = catalogs[6];
          this.typeSelected = this.mobility[0].code ?? null;
          this.spinner.hide("load");
        },
        (err) => {
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
      mergeMap((response: ResponseApi) =>iif(() => response.status === 'OK', of(response.result),throwError(response.message)))
    );
    return zip(currencyTypeCatalog$, workingDayCatalog$,mobilityCatalog$,vaccantStateCatalog$,countryCatalog$,industrySectorCatalog$, companyCatalog$);
  }



  // Table CRU
  saveItem() {
    this.saveItemOnDb(this.vaccantSelected, this.submitted);
  }

  saveItemOnDb(item: any, submitted: boolean) {

    const save$ = this._vaccantApi.create(item);
    const update$ = this._vaccantApi.update(item);
    const request$ = !submitted ? save$ : update$;
    this.spinner.show("save");
    request$.subscribe(
      (resp: ResponseApi) => {
        this._storage.deleteKey(STORAGE_LOCAL, VACANT_SELECTED_ROUTE);
        this.toast.addPrimeToast('success', '', 'La vacante ha sido guardada');
        this.spinner.hide("save");
        this.openPage('/account/vaccant/main');
      },
      (err) => {
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      },
      () => {}
    );
  }

  openPage(pageUrl: string) {
    this._router.navigate([pageUrl]);
  }

  getWorkingDay(value: any) {
    return this.workingDay.find(i => i.code === value)?.label ?? 'NE';
  }

  getIndustrySector(value: any) {
    return this.industrySector.find(i => i.value === value)?.label ?? 'NE';
  }

  getCountry(value: any) {
    return this.country.find(i => i.code === value)?.label ?? 'NE';
  }

  getTypeSelected(value: any) {
    return this.mobility.find(i => i.code === value)?.label ?? 'NE';
  }

  getIsPublic(value: any) {
    return this.categoriesVacantIsOpen.find(i => i.code === value)?.name ?? 'NE';
  }

  getIsVaccantOutstanding(value: any) {
    return this.categoriesVacantIsoutstanding.find(i => i.code === value)?.name ?? 'NE';
  }

}  
