import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { Catalog } from 'src/app/_models/Catalog';
import { Evaluation } from 'src/app/_models/Evaluation';
import { Plan } from 'src/app/_models/Plan';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { ProcessRequestResume } from 'src/app/_models/ProcessRequestResume';
import { Quote } from 'src/app/_models/Quote';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { Vaccant } from 'src/app/_models/Vaccant';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { EvaluationApiService } from 'src/app/_services/api/evaluation-api.service';
import { PlanApiService } from 'src/app/_services/api/plan-api.service';
import { ProcessApiService } from 'src/app/_services/api/process-api.service';
import { QuoteApiService } from 'src/app/_services/api/quote-api.service';
import { VaccantApiService } from 'src/app/_services/api/vaccant-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_COUNTRIES, CATALOG_CURRENCY_TYPE, CATALOG_EVALUATIONS, CATALOG_INDUSTRY_SECTOR, CATALOG_MOBILITY, CATALOG_PROCESS_STATE, CATALOG_PROJECT_TYPE, CATALOG_QUOTES, CATALOG_VACCANT_STATE, CATALOG_WORKING_DAY, PROCESS_SELECTED_ROUTE, STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED } from 'src/app/_utils/constants';

@Component({
  selector: 'app-process-resume',
  templateUrl: './process-resume.component.html',
  styleUrls: ['./process-resume.component.scss']
})
export class ProcessResumeComponent implements OnInit {

  // variables
  processSelected: ProcessApp = Object.create({});

  constructor(private readonly _storage: StorageService,
    private readonly _processApi: ProcessApiService,
    private confirmationService: ConfirmationService,
    private toast: CustomToastService,
    private spinner: NgxSpinnerService) {
    this.processSelected = this._storage.getObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
  }

  ngOnInit(): void {
  }
  onSubmit() {

    this.confirmationService.confirm({
      message: '¿Estás listo para enviar las invitaciones del proceso "' + this.processSelected.name + '"?',
      header: 'Confirmar',
      icon: 'pi pi-send',
      accept: () => {
        this.spinner.show("save");
        this._processApi.sendProcessRequest(this.processSelected.id)
          .subscribe((resp: ResponseApi) => {
            this.spinner.hide("save");
            this.toast.addPrimeToast('success', '', resp.message);
          }, err => {
            console.log(err);
            this.toast.addPrimeToast('error', '', err.error.message);
            this.spinner.hide("save");
          });
      },
    });

  }
}

@Component({
  selector: 'card-process',
  templateUrl: './card-process.html',
  styleUrls: ['./process-resume.component.scss']
})
export class CardResumeProcessComponent implements OnInit {

  // inputs
  @Input() item!: ProcessApp;
  // catalogs
  types: Catalog[] = [];
  states: Catalog[] = [];

  // variables
  loading = true;
  constructor(private readonly _catalogAPi: CatalogApiService,
    private router: Router) { }

  ngOnInit(): void {
    this.loading = true;
    this.loadCatalogs().subscribe((catalogs: [Catalog[], Catalog[]]) => {
      this.types = catalogs[0];
      this.states = catalogs[1];
      this.loading = false;
    }, err => {
      console.log(err);
      this.loading = false;
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
  getTypeLabel(code: number) {
    return this.types.find(i => i.code === code)?.label ?? 'ND';
  }
  openPage(url: string) {
    this.router.navigate([url]);
  }
  getProcessStateLabel(code: number) {
    return this.states.find(i => i.code === code)?.label ?? 'NE';
  }
  getProcessStateValue(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'NE';
  }

}

@Component({
  selector: 'card-evaluations',
  templateUrl: './card-evaluations.html',
  styleUrls: ['./process-resume.component.scss']
})
export class CardResumeEvaluationsComponent implements OnInit {
  // catalogs
  evaluationsAvailables: Catalog[] = [];
  // inputs
  @Input() item!: ProcessApp;
  // variables
  loading = false;
  evaluations: any[] = [];
  allEvaluations: Evaluation[] = [];
  constructor(private router: Router,
    private readonly _processApi: ProcessApiService,
    private readonly _catalogApi: CatalogApiService,
    private readonly _evaluationsApi: EvaluationApiService) { }
  ngOnInit() {

    const getAllEvaluations$: Observable<any> = this._evaluationsApi.findAllEvaluation().pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const getProcessEvaluations$ = this._processApi.findEvaluations(this.item.id).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    this.loading = true;
    this.loadCatalogs().pipe(
      tap((resp: any[]) => {
        this.evaluationsAvailables = resp[0];
      }),
      mergeMap((resp: any) => zip(getAllEvaluations$, getProcessEvaluations$))
    ).subscribe((responses: [any, Evaluation[]]) => {
      this.allEvaluations = responses[0];
      const evaluations = responses[1].filter(i => this.allEvaluations.map(j => j.id).includes(i.id)).map((i: any) => {
        const profiles: any[] = i.profiles ?? [];
        const profilesNames: string[] = profiles.map(i => i.name);
        const cataogItem = this.evaluationsAvailables.find(item => item.code === i.id);
        const color = cataogItem?.metadata?.color ?? 'ND';
        const order = cataogItem?.order ?? 0;
        const item = {
          evaluation: i.name ?? 'ND',
          profile: profilesNames.toString(),
          color,
          id: i.id,
          order
        };
        return item;
      }).sort((a: any, b: any) => a.order - b.order);
      this.evaluations = evaluations;
      this.loading = false;
    }, err => {
      this.loading = false;
    });
  }
  openPage(url: string) {
    this.router.navigate([url]);
  }
  loadCatalogs(): Observable<any> {
    const getEvaluations$ = this._catalogApi.findAllByType(CATALOG_EVALUATIONS).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getEvaluations$);
  }
}

@Component({
  selector: 'card-requests',
  templateUrl: './card-requests.html',
  styleUrls: ['./process-resume.component.scss']
})
export class CardResumeRequestsComponent implements OnInit {
  // inputs
  @Input() item!: ProcessApp;
  @Input() quotes: Catalog[] = [];
  // variables
  loading = false;
  plan: Plan = Object.create({});
  accountSelected: AccountResume = Object.create({});
  items: ProcessRequestResume[] = [];
  countRequestSelected = 0;
  processRequestQuote: Quote = Object.create(null);
  showQuotes = false;

  constructor(private router: Router,
    private readonly _storage: StorageService,
    private _processApi: ProcessApiService,
    private _planApi: PlanApiService,
    private _quoteApi: QuoteApiService,
    private readonly _catalogAPi: CatalogApiService) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
  }
  ngOnInit() {
    this.loading = true;
    this.refreshQuote(this.accountSelected.id);
    this.loadData()
      .subscribe((results: [Plan, ProcessRequestResume[], Catalog[]]) => {
        this.loading = false;
        this.plan = results[0];
        this.items = results[1];
        this.quotes = results[2];
        if (this.items.length > 0) {
          this.countRequestSelected = this.items.map(i => i.selected ? 1 : 0)
            .reduce((accumulator: any, currentValue: number) => accumulator + currentValue);
        }
      }, err => {
        console.log(err);
        this.loading = false;
      });
  }
  loadData(): Observable<any> {
    const getPlan$: any = this._planApi.findById(this.accountSelected.id).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
    );
    const getRequests$ = this._processApi.findRequests(this.item.id).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
    );
    const getQuotesCatalog$ = this._catalogAPi.findAllByType(CATALOG_QUOTES).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getPlan$, getRequests$, getQuotesCatalog$);
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
  openPage(url: string) {
    this.router.navigate([url]);
  }
  isCandidatesPerMonthQuote(codeType: number) {
    return this.quotes.find(i => i.code === codeType)?.value === 'processRequestsPerMonth';
  }
}

@Component({
  selector: 'card-vaccant',
  templateUrl: './card-vaccant.html',
  styleUrls: ['./process-resume.component.scss']
})
export class CardResumeVaccantComponent implements OnInit {

  @Input() item!: ProcessApp;

  loading = false;
  show = false;
  planSelected!: Plan;
  vaccant!: Vaccant;

  isPublic: any = '';
  categoriesVacantIsOpen: any[] = [{name: 'Si', code: 1}, {name: 'No', code: 0}];

  isOutstanding: any = '';
  categoriesVacantIsoutstanding: any[] = [{name: 'Si', code: 1}, {name: 'No', code: 0}];

  //catalogs
  currencyType: Catalog[] = [];
  workingDay: Catalog[] = [];
  mobility: Catalog[] = [];
  statusVaccant: Catalog[] = [];
  country: Catalog[]=[];
  industrySector: Catalog[]=[];

  constructor(private router: Router,
    private _storage: StorageService,
    private _vaccantApi: VaccantApiService,
    private readonly _catalogAPi: CatalogApiService) {
    this.planSelected = this._storage.getObject(STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED);
  }

  ngOnInit(): void {
    this.loading = true;
    this.loadCatalogs().pipe(
      tap((catalogs: Catalog[][]) => {
        this.currencyType = catalogs[0];
        this.workingDay = catalogs[1];
        this.mobility = catalogs[2];
        this.statusVaccant = catalogs[3];
        this.country = catalogs[4];
        this.industrySector = catalogs[5];
      }),
      mergeMap((resp: any) => this._vaccantApi.findVaccantByIdProcess(this.item.id))
    ).subscribe((resp: ResponseApi) => {
      this.vaccant = resp.result;
      this.loading = false;
    });
  }

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
    return zip(currencyTypeCatalog$, workingDayCatalog$,mobilityCatalog$,vaccantStateCatalog$,countryCatalog$,industrySectorCatalog$);
  }

  openPage(url: string) {
    this.router.navigate([url]);
  }
  getIsPublic(value: any) {
    return this.categoriesVacantIsOpen.find(i => i.code === value)?.name ?? 'NE';
  }

  getIsVaccantOutstanding(value: any) {
    return this.categoriesVacantIsoutstanding.find(i => i.code === value)?.name ?? 'NE';
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

}