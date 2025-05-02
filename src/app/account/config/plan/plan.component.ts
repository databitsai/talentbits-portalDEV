import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { Authority } from 'src/app/_models/Authority';
import { Catalog } from 'src/app/_models/Catalog';
import { Company } from 'src/app/_models/Company';
import { Plan } from 'src/app/_models/Plan';
import { Quote } from 'src/app/_models/Quote';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { AccountApiService } from 'src/app/_services/api/account-api.service';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { CompanyApiService } from 'src/app/_services/api/company-api.service';
import { PlanApiService } from 'src/app/_services/api/plan-api.service';
import { QuoteApiService } from 'src/app/_services/api/quote-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_COUNTRIES, CATALOG_INDUSTRY_SECTOR, CATALOG_PAYMENT_TYPE, CATALOG_QUOTES, PATTERN_EMAIL, PATTERN_PHONE, PATTERN_URL, PLAN_DEFAULT_PRICE, ROLE_ACCESS_ADMIN, ROLE_ACCOUNT_OWNER, STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED, TOKEN_INFO_ACCESS } from 'src/app/_utils/constants';

/**MAIN */
@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanComponent implements OnInit {

  // catalogs
  paymentTypes: Catalog[] = [];
  industrySectors: Catalog[] = [];
  countries: Catalog[] = [];
  quotes: Catalog[] = [];
  // variables
  accountSelected: AccountResume = Object.create({});
  plan: Plan = Object.create({});
  company: Company = Object.create({});

  constructor(private readonly _storage: StorageService,
    private readonly _catalogAPi: CatalogApiService,
    private _planApi: PlanApiService,
    private readonly _companyApi: CompanyApiService,
    private toast: CustomToastService,
    private spinner: NgxSpinnerService,
    private _quoteApi: QuoteApiService) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
  }

  ngOnInit(): void {

    const getPlan$: Observable<Plan> = this._planApi.findById(this.accountSelected.id).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
    );
    const getCompany$: Observable<Company> =  this._companyApi.findByAccountId(this.accountSelected.id).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
    );

    
    this.spinner.show("load");
    this.loadCatalogs().pipe(
      tap((catalogs: [Catalog[], Catalog[], Catalog[], Catalog[]]) => {
        this.paymentTypes = catalogs[0];
        this.industrySectors = catalogs[1];
        this.countries = catalogs[2];
        this.quotes = catalogs[3];
      }),
      mergeMap((resp: any) => zip(getPlan$, getCompany$))
    )
      .subscribe((responses: any[]) => {
        this.plan = responses[0];
        this.company = responses[1];
        this.spinner.hide("load");
      }, err => {
        console.log(err);
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("load");
      });
  }
  loadCatalogs(): Observable<any> {
    const paymentTypesCatalog$ = this._catalogAPi.findAllByType(CATALOG_PAYMENT_TYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const industrySectorCatalog$ = this._catalogAPi.findAllByType(CATALOG_INDUSTRY_SECTOR).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const countriesSectorCatalog$ = this._catalogAPi.findAllByType(CATALOG_COUNTRIES).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const quotesCatalog$ = this._catalogAPi.findAllByType(CATALOG_QUOTES).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(paymentTypesCatalog$, industrySectorCatalog$, countriesSectorCatalog$, quotesCatalog$);
  }
}

/** COMPANY*/
@Component({
  selector: 'app-plan-company',
  templateUrl: './plan-company.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanCompanyComponent implements OnInit {
  @Input() company: Company = Object.create({});
  // forms
  companyForm!: FormGroup;
  // catalogs
  @Input() industrySectors: Catalog[] = [];
  @Input() countries: Catalog[] = [];
  // variables
  accountSelected: AccountResume = Object.create({});
  showFormEdit = false;
  loadData = false;
  
  checkTitle = '';

  constructor(
    private readonly _companyApi: CompanyApiService,
    private readonly _storage: StorageService,
    private toast: CustomToastService,
    private spinner: NgxSpinnerService,
    private fb: FormBuilder) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
  }

  ngOnInit(): void {

    this.companyForm = this.fb.group({
      id: [],
      name: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      businessName: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      ruc: ['', Validators.compose([Validators.required, Validators.maxLength(13)])],
      email: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_EMAIL)])],
      phone: ['', Validators.compose([Validators.maxLength(45), Validators.pattern(PATTERN_PHONE)])],
      sector: ['', Validators.compose([Validators.required])],
      website: ['', Validators.compose([Validators.maxLength(150), Validators.pattern(PATTERN_URL)])],
      country: ['', Validators.compose([Validators.required])]
    });

  }
  onShowFormEdit() {
    this.companyForm.get('id')?.setValue(this.company.id);
    this.companyForm.get('name')?.setValue(this.company.name);
    this.companyForm.get('businessName')?.setValue(this.company.businessName);
    this.companyForm.get('ruc')?.setValue(this.company.ruc);
    this.companyForm.get('email')?.setValue(this.company.email);
    this.companyForm.get('phone')?.setValue(this.company.phone);
    this.companyForm.get('sector')?.setValue(this.company.sector);
    this.companyForm.get('website')?.setValue(this.company.website);
    this.companyForm.get('country')?.setValue(this.company.country);
    this.showFormEdit = true;
  }
  onCancelFormEdit() {
    this.companyForm.reset();
    this.showFormEdit = false;
  }
  saveAccount() {
    if (this.companyForm.valid) {
      this.spinner.show("save");
      this._companyApi.update(this.companyForm.value).pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp), throwError(resp))),
        tap((resp: ResponseApi) => this.toast.addPrimeToast('success', '', resp.message)),
        map((resp: ResponseApi) => resp.result)
      ).subscribe((resp: Company) => {
        this.company = {
          ...this.company,
          ...resp
        };
        this.showFormEdit = false;
        this.spinner.hide("save");
        this.companyForm.reset();
        this._storage.createObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE, { account: this.company.name, id: this.accountSelected.id, type: this.accountSelected.type });
      }, err => {
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      });

    } else {
      this.validateAllFormFields(this.companyForm);
    }
  }
  getCountryLabel() {
    return this.countries.find(i => i.code === this.company.country)?.label ?? '';
  }
  getSectorLabel() {
    return this.industrySectors.find(i => i.value === this.company.sector)?.label ?? '';
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

}
/** PLAN*/
@Component({
  selector: 'app-plan-plan',
  templateUrl: './plan-plan.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanPlanComponent implements OnInit {
  @Input() plan: Plan = Object.create({});
  @Input() idAccount!: number;
  @Input() quotes: Catalog[] = [];
  // forms
  planForm!: FormGroup;
  // variables
  showFormEdit = false;
  processRequestQuote: Quote = Object.create(null);
  showQuotes = false;
  planTypeSelectedValue!: number;
  authorities: Authority[] = [];

  constructor(private fb: FormBuilder,
    private _planApi: PlanApiService,
    private toast: CustomToastService,
    private spinner: NgxSpinnerService,
    private _quoteApi: QuoteApiService,
    private readonly _storage: StorageService) {
      this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
  }

  ngOnInit(): void {
    this.planForm = this.fb.group({
      name: ['', Validators.compose([Validators.required])],
      licences: ['', Validators.compose([Validators.required])],
      candidatesPerMonth: ['', Validators.compose([Validators.required])],
      type: []
    });

    this.refreshQuote(this.idAccount);

  }
  refreshQuote(idAccount: number): void {
    const getQuoteProcessRequest$: Observable<Quote> = this._quoteApi.fetchProcessRequestCurrentMonthQuote(idAccount).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
    );

    getQuoteProcessRequest$.subscribe((resp: any) => {
      this.processRequestQuote = resp;
      this.showQuotes = true;
    });
  }
  onShowFormEdit() {
    this.planForm.get('name')?.setValue(this.plan.name);
    this.planForm.get('licences')?.setValue(this.plan.licences);
    this.planForm.get('candidatesPerMonth')?.setValue(this.plan.candidatesPerMonth);
    this.planForm.get('type')?.setValue(this.plan.type);
    this.planTypeSelectedValue = this.plan.type;
    this.showFormEdit = true;
  }
  onCancelFormEdit() {
    this.showFormEdit = false;
  }
  savePlan() {
    const request: any = {
      ...this.plan,
      ...this.planForm.value
    };
    this.spinner.show("save");
    this._planApi.update(request)
      .pipe(
        tap((resp: ResponseApi) => this.toast.addPrimeToast('success', '', resp.message)),
        map((resp: ResponseApi) => resp.result)
      )
      .subscribe((resp: any) => {
        this.plan = {
          ...this.plan,
          ...resp
        };
        this.planForm.reset();
        this.showFormEdit = false;
        this.spinner.hide("save");
        this.refreshQuote(this.idAccount);
      }, err => {
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      });
  }
  isCandidatesPerMonthQuote(codeType: number) {
    return this.quotes.find(i => i.code === codeType)?.value === 'processRequestsPerMonth';
  }
  get planType() {
    return this.planForm.get('type')?.value;
  }
  get isAdmin() {
    return this.authorities.some(i => i.authority === ROLE_ACCESS_ADMIN);
  }

}
/** OPTIONS*/
@Component({
  selector: 'app-plan-options',
  templateUrl: './plan-options.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanOptionsComponent implements OnInit {
  @Input() plan: Plan = Object.create({});
  @Input() company: Company = Object.create({});
  // forms
  optionsForm!: FormGroup;

  // variables
  showFormOptions = false;
  checkTitle = '';
  accountSelected: AccountResume = Object.create({});
  authorities: Authority[] = [];

  constructor(private fb: FormBuilder,
    private _planApi: PlanApiService,
    private toast: CustomToastService,
    private spinner: NgxSpinnerService,
    private confirmationService: ConfirmationService,
    private _accountApi: AccountApiService,
    private readonly _storage: StorageService,
    private readonly router: Router) {
      this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
      this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
  }

  ngOnInit(): void {

    this.optionsForm = this.fb.group({
      isPostVacancyActive: [false],
      isHighlightVacancyActive: [false],
      isBenchmarkingActive: [false],
      isSupportCallActive: [false]
    });

  }
  onShowFormOptions() {
    this.optionsForm.get('isPostVacancyActive')?.setValue(this.plan.isPostVacancyActive);
    this.optionsForm.get('isHighlightVacancyActive')?.setValue(this.plan.isHighlightVacancyActive);
    this.optionsForm.get('isBenchmarkingActive')?.setValue(this.plan.isBenchmarkingActive);
    this.optionsForm.get('isSupportCallActive')?.setValue(this.plan.isSupportCallActive);
    this.showFormOptions = true;
  }
  onCancelFormOptions() {
    this.optionsForm.reset();
    this.showFormOptions = false;
  }
  saveOptions() {
    const request: any = {
      ...this.plan,
      ...this.optionsForm.value
    };
    this.spinner.show("save");
    this._planApi.update(request)
      .pipe(
        tap((resp: ResponseApi) => this.toast.addPrimeToast('success', '', resp.message)),
        map((resp: ResponseApi) => resp.result)
      )
      .subscribe((resp: any) => {
        this.plan = {
          ...this.plan,
          ...resp
        };
        this.optionsForm.reset();
        this._storage.createObject(STORAGE_LOCAL ,STORAGE_PLAN_ACCOUNT_SELECTED, resp);
        this.showFormOptions = false;
        this.spinner.hide("save");
      }, err => {
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      });
  }
  deleteItem() {
    this.confirmationService.confirm({
      message: '¿Está seguro de eliminar la cuenta?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (this.checkTitle === this.company.name) {
          this.spinner.show("load");
          this._accountApi.delete(this.accountSelected.id)
            .pipe(
              mergeMap((responseApi: ResponseApi) => iif(() => responseApi.status === 'OK', of(responseApi), of(responseApi)))
            )
            .subscribe((response: ResponseApi) => {
              this.spinner.hide("load");
              this.toast.addPrimeToast('success', '', response.message);
              this._storage.deleteKey(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
              this.router.navigate(['/admin/accounts/corporative']);
            }, err => {
              console.log(err);
              this.spinner.hide("load");
              this.toast.addPrimeToast('error', '', err.message);
            });
        } else {
          this.toast.addPrimeToast('info', '', 'El nombre de la cuenta no es igual');
        }

      }
    });
  }
  get isAdmin() {
    return this.authorities.some(i => i.authority === ROLE_ACCESS_ADMIN);
  }
  get isOwner() {
    return this.authorities.some(i => i.authority === ROLE_ACCOUNT_OWNER);
  }
}
/** PAYMENT*/
@Component({
  selector: 'app-plan-payment',
  templateUrl: './plan-payment.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanPaymentComponent implements OnInit {
  @Input() plan: Plan = Object.create({});
  // forms
  paymentForm!: FormGroup;
  // catalogs
  @Input() paymentTypes: Catalog[] = [];
  // variables
  paymentTypeSelectedValue!: number;
  showFormPayment = false;
  authorities: Authority[] = [];

  constructor(private fb: FormBuilder,
    private readonly _storage: StorageService,
    private _planApi: PlanApiService,
    private toast: CustomToastService,
    private spinner: NgxSpinnerService) {
      this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
  }

  ngOnInit(): void {
    this.paymentForm = this.fb.group({
      paymentType: ['', Validators.compose([Validators.required])],
      isPaymentRecurrent: [false],
      priceMonth: [PLAN_DEFAULT_PRICE, Validators.compose([Validators.required])],
      priceYear: [PLAN_DEFAULT_PRICE, Validators.compose([Validators.required])]
    });

  }
  onShowFormPayment() {
    this.paymentTypeSelectedValue = this.plan.paymentType;
    this.paymentForm.get('paymentType')?.setValue(this.paymentTypeSelectedValue);
    this.paymentForm.get('isPaymentRecurrent')?.setValue(this.plan.isPaymentRecurrent);
    this.paymentForm.get('priceMonth')?.setValue(this.plan.priceMonth);
    this.paymentForm.get('priceYear')?.setValue(this.plan.priceYear);
    this.showFormPayment = true;
  }
  onCancelFormPayment() {
    this.paymentForm.reset();
    this.paymentTypeSelectedValue = Object.create(null);
    this.showFormPayment = false;
  }
  savePayment() {
    const request: any = {
      ...this.plan,
      ...this.paymentForm.value
    };
    this.spinner.show("save");
    this._planApi.update(request)
      .pipe(
        tap((resp: ResponseApi) => this.toast.addPrimeToast('success', '', resp.message)),
        map((resp: ResponseApi) => resp.result)
      )
      .subscribe((resp: any) => {
        this.plan = {
          ...this.plan,
          ...resp
        };
        this.paymentForm.reset();
        this.showFormPayment = false;
        this.spinner.hide("save");
      }, err => {
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      });
  }
  getPaymentPlanTypeLabel() {
    return this.paymentTypes.find(i => i.code === this.plan.paymentType)?.label ?? '';
  }
  get isAdmin() {
    return this.authorities.some(i => i.authority === ROLE_ACCESS_ADMIN);
  }
}