import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap} from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { Plan } from 'src/app/_models/Plan';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { AccountApiService } from 'src/app/_services/api/account-api.service';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { PlanApiService } from 'src/app/_services/api/plan-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { CATALOG_COUNTRIES, CATALOG_INDUSTRY_SECTOR, CATALOG_PAYMENT_TYPE, CATALOG_QUOTES, PATTERN_EMAIL, PATTERN_NAMES, PATTERN_PASSWORD, PATTERN_PHONE, PATTERN_URL, PLAN_DEFAULT_CANDIDATES, PLAN_DEFAULT_LICENCES, PLAN_DEFAULT_PRICE } from 'src/app/_utils/constants';

@Component({
  selector: 'app-create-account-corporative',
  templateUrl: './create-account-corporative.component.html',
  styleUrls: ['./create-account-corporative.component.scss']
})
export class CreateAccountCorporativeComponent implements OnInit {
  // catalogs
  industrySectors: Catalog[] = [];
  countries: Catalog[] = [];
  paymentTypes: Catalog[] = [];
  planTemplates: Plan[] = [];
  quotes: Catalog[] = [];
  // forms
  userForm!: FormGroup;
  accessForm!: FormGroup;
  companyForm!: FormGroup;
  planForm!: FormGroup;
  // variables
  paymentTypeSelectedValue!: number;
  loadData = false;
  defaultPlanSelected: Plan = Object.create({});
  patternPassword = PATTERN_PASSWORD;

  constructor(private fb: FormBuilder,
    private readonly _catalogAPi: CatalogApiService,
    private readonly _planApi: PlanApiService,
    private readonly _accountApi: AccountApiService,
    private toast: CustomToastService,
    private router: Router,
    private translateService: TranslateService,
    private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    // Forms
    this.userForm = this.fb.group({
      firstName: ['', Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
      lastName: ['', Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
      phone: ['', Validators.compose([Validators.maxLength(45), Validators.pattern(PATTERN_PHONE)])],
      job: ['', Validators.compose([Validators.maxLength(45)])]
    });
    this.accessForm = this.fb.group({
      username: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_EMAIL)])],
      password: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_PASSWORD)])]
    });
    this.companyForm = this.fb.group({
      nameCompany: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      nameBusinessCompany: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      ruc: ['', Validators.compose([Validators.required, Validators.maxLength(13)])],
      email: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_EMAIL)])],
      phoneCompany: ['', Validators.compose([Validators.maxLength(45), Validators.pattern(PATTERN_PHONE)])],
      sector: ['', Validators.compose([Validators.required])],
      website: ['', Validators.compose([Validators.maxLength(150), Validators.pattern(PATTERN_URL)])],
      country: ['', Validators.compose([Validators.required])]
    });
    this.planForm = this.fb.group({
      namePlan: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      isPostVacancyActive: [false],
      isHighlightVacancyActive: [false],
      licences: [PLAN_DEFAULT_LICENCES, Validators.compose([Validators.required])],
      candidatesPerMonth: [PLAN_DEFAULT_CANDIDATES, Validators.compose([Validators.required])],
      isBenchmarkingActive: [false],
      priceMonth: [PLAN_DEFAULT_PRICE, Validators.compose([Validators.required])],
      priceYear: [PLAN_DEFAULT_PRICE, Validators.compose([Validators.required])],
      paymentType: [this.paymentTypeSelectedValue, Validators.compose([Validators.required])],
      isPaymentRecurrent: [false],
      isSupportCallActive: [false],
      parentTemplate: [null],
      planType: ['']
    });
    // force clean
    this.accessForm.get('username')?.setValue('');
    this.accessForm.get('username')?.enable();
    // Load data
    this.loadData = true;
    this.spinner.show("load");
    this.loadCatalogs()
      .subscribe((catalogs: [Catalog[], Catalog[], Catalog[], Plan[], Catalog[]]) => {
        this.industrySectors = catalogs[0];
        this.countries = catalogs[1];
        this.paymentTypes = catalogs[2];
        this.planTemplates = catalogs[3];
        this.quotes = catalogs[4];
        // set default payment type
        if (this.paymentTypes.length > 0) {
          this.paymentTypeSelectedValue = this.paymentTypes[0].code;
          this.planForm.get('paymentType')?.setValue(this.paymentTypeSelectedValue);
        }
        // set default plan
        const defaultPlan: Plan = new Plan();
        defaultPlan.id = null;
        defaultPlan.name = this.translateService.instant('t.custom');
        this.planTemplates.unshift(defaultPlan);
        // set plan default type
        const quoteCode: number | undefined= this.quotes.find(i => i.value === 'processRequestsTotal')?.code;
        if (quoteCode !== undefined) {
          this.planForm.get('planType')?.setValue(quoteCode);
        }

        this.spinner.hide("load");

      }, err => {
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("load");
      }, () => {
        this.loadData = false;
      });
  }
  loadCatalogs(): Observable<any> {
    const industrySectorCatalog$ = this._catalogAPi.findAllByType(CATALOG_INDUSTRY_SECTOR).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const countriesSectorCatalog$ = this._catalogAPi.findAllByType(CATALOG_COUNTRIES).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const paymentTypesCatalog$ = this._catalogAPi.findAllByType(CATALOG_PAYMENT_TYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const planTemplates$ = this._planApi.findTemplateAll().pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const quotesCatalog$ =  this._catalogAPi.findAllByType(CATALOG_QUOTES).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(industrySectorCatalog$, countriesSectorCatalog$, paymentTypesCatalog$, planTemplates$, quotesCatalog$);
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
  onSubmit() {
    if (this.userForm.valid && this.accessForm.valid && this.companyForm.valid && this.planForm.valid) {
      this.spinner.show("save");
      const request: any = {
        ...this.userForm.value,
        ...this.accessForm.value,
        ...this.companyForm.value,
        ...this.planForm.value
      };
      this._accountApi.createCorporative(request).subscribe((resp: ResponseApi) => {
        this.toast.addPrimeToast('success', '', resp.message);
        this.router.navigate(['admin', 'accounts', 'corporative']);
        this.spinner.hide("save");
      }, err => {
        console.log(err);
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      }, () => {
      });
    } else {
      this.toast.addPrimeToast('error', '', this.translateService.instant('t.forminvalid')); //TODO:
    }
  }
  // For custom componen
  onChangePostVacancy() {
    if (!this.planForm.get('isPostVacancyActive')?.value) {
      this.planForm.get('isHighlightVacancyActive')?.setValue(false);
    }
  }
  onChangePlanSelector() {
    if (this.defaultPlanSelected.id !== null) {
      // deep clone
      const auxTemplate: any = JSON.parse(JSON.stringify(this.defaultPlanSelected));
      auxTemplate.parentTemplate = this.defaultPlanSelected.id;
      delete auxTemplate.id;
      delete auxTemplate.createdAt;
      delete auxTemplate.updatedAt;
      auxTemplate.namePlan = auxTemplate.name;
      delete auxTemplate.name;
      const quoteCode: number | undefined= this.quotes.find(i => i.value === 'processRequestsPerMonth')?.code;
      if (quoteCode !== undefined) {
        auxTemplate.planType = quoteCode;
      }
      this.planForm.setValue(auxTemplate);
    } else {
      this.planForm.reset();
      if (this.paymentTypes.length > 0) {
        this.paymentTypeSelectedValue = this.paymentTypes[0].code;
        this.planForm.get('paymentType')?.setValue(this.paymentTypes[0].code);
      }
      this.planForm.get('priceMonth')?.setValue(PLAN_DEFAULT_PRICE);
      this.planForm.get('priceYear')?.setValue(PLAN_DEFAULT_PRICE);
      this.planForm.get('licences')?.setValue(PLAN_DEFAULT_LICENCES);
      this.planForm.get('candidatesPerMonth')?.setValue(PLAN_DEFAULT_CANDIDATES);
      this.planForm.get('isPostVacancyActive')?.setValue(false);
      this.planForm.get('isHighlightVacancyActive')?.setValue(false);
      this.planForm.get('isBenchmarkingActive')?.setValue(false);
      this.planForm.get('isPaymentRecurrent')?.setValue(false);
      this.planForm.get('isSupportCallActive')?.setValue(false);
      this.planForm.get('parentTemplate')?.setValue(null);

      const quoteCode: number | undefined= this.quotes.find(i => i.value === 'processRequestsTotal')?.code;
      if (quoteCode !== undefined) {
        console.log(quoteCode);
        this.planForm.get('planType')?.setValue(quoteCode);
      }
    }
    this.toast.addPrimeToast('info', '', 'Plan seleccionado: ' + this.defaultPlanSelected.name);
  }
  isCandidatesPerMonthQuote(codeType: number) {
    return this.quotes.find(i => i.code === codeType)?.value === 'processRequestsPerMonth';
  }
  get planType() {
    return this.planForm.get('planType')?.value;
  }

}
