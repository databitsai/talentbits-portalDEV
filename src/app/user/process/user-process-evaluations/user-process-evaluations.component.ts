import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { filter, mergeMap, tap } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { UserEvaluation } from 'src/app/_models/UserEvaluation';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { ProcessApiService } from 'src/app/_services/api/process-api.service';
import { UserProcessApiService } from 'src/app/_services/api/user-process-api.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { CATALOG_PROCESS_STATE, CATALOG_PROJECT_TYPE, PROCESS_USER_SELECTED_EVALUATION, PROCESS_USER_SELECTED_ROUTE, STORAGE_LOCAL } from 'src/app/_utils/constants';

interface ProcessSelected {
  id: number;
  idUserProcess: number;
  name: string;
  status: number;
}

@Component({
  selector: 'app-user-process-evaluations',
  templateUrl: './user-process-evaluations.component.html',
  styleUrls: ['./user-process-evaluations.component.scss']
})
export class UserProcessEvaluationsComponent implements OnInit {

  // variables
  items: any[] = [];
  process: ProcessSelected = Object.create({});
  showState = false;

  // catalogs
  states: Catalog[] = [];

  constructor(private _storage: StorageService,
    private _userProcessApi: UserProcessApiService,
    private router: Router,
    private readonly _catalogAPi: CatalogApiService,
    private spinner: NgxSpinnerService) {
    this.process = this._storage.getObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_ROUTE);
  }
  ngOnInit(): void {
    this._storage.deleteKey(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION);
    this.spinner.show("load");
    this.loadCatalogs().pipe(
      tap((resp: [Catalog[], Catalog[]]) => {
        this.states = resp[1];
      }),
      mergeMap((resp: any) => of(this.process)),
      filter((process: ProcessSelected) => process !== null),
      mergeMap((process: ProcessSelected) => this._userProcessApi.fetchEvaluationsQuestionsByProcess(process.id, process.idUserProcess)),
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of( resp.result), throwError(resp)) ),
    )
    .subscribe((resp: any) => {
      this.items = resp;
      this.showState = true;
      this.spinner.hide("load");
    }, err => {
      console.log(err);
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
  sumAproximateTime(questions: any[]) {
    // aproximateTime
    const seconds = questions.length > 0 ? questions.map((i: any) => i.aproximateTime).reduce((acc, item) => acc + item) : 0;
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      return `${(seconds/60).toFixed(1)}min`;
    }
  }
  runEvaluation(item: any) {
    this._storage.createObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION, item);
    this.router.navigate(['/user/process/evaluations/introduction']);
  }
  getProcessStateLabel(code: number) {
    return this.states.find(i => i.code === code)?.label ?? 'Sin iniciar';
  }
  getProcessStateValue(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'default';
  }
}

@Component({
  selector: 'app-user-process-evaluations-actions',
  templateUrl: './user-process-evaluations-actions.component.html',
  styleUrls: ['./user-process-evaluations.component.scss']
})
export class UserProcessEvaluationActionsComponent implements OnInit {

  @Input() valueStateProcess!: string;
  @Input() valueStateEvaluation!: string;
  @Input() states!: Catalog[];
  @Input() item!: any;

  constructor(
    private _storage: StorageService,
    private router: Router) {}

  ngOnInit(): void {
  }

  runEvaluation(item: any) {
    this._storage.createObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION, item);
    this.router.navigate(['/user/process/evaluations/introduction']);
  }
  showResult(item: any) {
    console.log(item);
    item = {
      ...item,
      idMemberEvaluation: this.item.idMemberEvaluation
    };
    console.log(item);
    this._storage.createObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION, item);
    this.router.navigate(['quiz']);
  }
}
