import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { ScrollPanel } from 'primeng/scrollpanel';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { Catalog } from 'src/app/_models/Catalog';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { ReportApiService } from 'src/app/_services/api/report-api.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_PROCESS_STATE, CATALOG_PROJECT_TYPE, CATALOG_QUALIFICATION_ARCHETYPE, COLOR_CHART_BG_GRAY1_TRANSPARENT, COLOR_CHART_BORDER, COLOR_CHART_FILL, COLOR_GRAY_LIGHT, COLOR_THEME_1, COLOR_THEME_2, COLOR_THEME_3, FORMAT_DATE_PDF, PROCESS_SELECTED_ROUTE, QUALIFICATION_ARCHETYPES_CODE_DATA_PERSONAS, STORAGE_LOCAL } from 'src/app/_utils/constants';
import * as _ from 'underscore';
declare var ChartDataLabels: any;
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import * as moment from 'moment';
import { ReportParticipantsService } from './report-participants.service';
import html2canvas from 'html2canvas';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { PipeFormatNamesPipe } from 'src/app/_shared/pipes/pipe-format-names.pipe';
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;

interface ProcessInfo {
  noEvaluations: number;
  noRequests: number;
  avgNoQuestions: number;
  avgScore: number;
  avgTimePerformed: number;
  hasDataPersonas: boolean;
}
interface FilterSubmit {
  idProcess: number;
  evaluations: number[];
  participants: number[];
}
// ------------ MAIN ------------------
@Component({
  selector: 'app-report-participants',
  templateUrl: './report-participants.component.html',
  styleUrls: ['./report-participants.component.scss']
})
export class ReportParticipantsComponent implements OnInit {

  processSelected: ProcessApp = Object.create({});
  accountSelected: AccountResume = Object.create({});
  loading = true;
  idProcess!: number;
  processInfo!: ProcessInfo;
  evaluationIds: number[] = [];
  participantIds: number[] = [];
  hasDataPersonasEvaluation = false;

  // catalogs
  types: Catalog[] = [];
  states: Catalog[] = [];
  archetypes: Catalog[] = [];

  constructor(private readonly _storage: StorageService,
    private readonly _catalogAPi: CatalogApiService,
    private spinner: NgxSpinnerService,
    private _reportApi: ReportApiService) {
    this.processSelected = this._storage.getObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
    this.idProcess = this.processSelected.id;
  }

  ngOnInit(): void {
    this.spinner.show("load");
    this.loadCatalogs().pipe(
      tap((catalogs: [Catalog[], Catalog[], Catalog[]]) => {
        this.types = catalogs[0];
        this.states = catalogs[1];
        this.archetypes = catalogs[2];
      }),
      mergeMap((resp: any) => this._reportApi.processFetchResume({ idProcess: this.processSelected.id, evaluations: [] }))
    )
      .subscribe((resp: ResponseApi) => {
        this.processInfo = resp.result;
        this.hasDataPersonasEvaluation = this.processInfo.hasDataPersonas;
        this.spinner.hide("load");
        this.loading = false;
      }, err => {
        this.spinner.hide("load");
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
    const getArchetypes$ = this._catalogAPi.findAllByType(CATALOG_QUALIFICATION_ARCHETYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getTypes$, getStates$, getArchetypes$);
  }
  getProcessTypeLabel(code: number) {
    return this.types.find(i => i.code === code)?.label ?? 'NE';
  }
  onSubmitFilter(filter: FilterSubmit) {
    this.idProcess = filter.idProcess;
    this.evaluationIds = filter.evaluations;
    this.participantIds = filter.participants;
    // check data personas
    if (this.evaluationIds.length > 0) {
      this.hasDataPersonasEvaluation = this.evaluationIds.includes(QUALIFICATION_ARCHETYPES_CODE_DATA_PERSONAS);
    } else {
      this._reportApi.processFetchResume({ idProcess: this.processSelected.id, evaluations: [] })
      .subscribe((resp: ResponseApi) => {
        this.hasDataPersonasEvaluation = resp.result.hasDataPersonas;
      });
    }
    
  }

}
// ------------ SCORE TABLE ------------------
@Component({
  selector: 'app-report-participants-score-table',
  templateUrl: './report-participants-score-table.component.html',
  styleUrls: ['./report-participants.component.scss']
})
export class ReportParticipantsScoreTableComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];
  @Input() participantIds: number[] = [];

  basicData: any;
  basicOptions: any;
  data: any[] = [];
  scrollTableSize = { width: '100%', height: '250px' };
  pageSizes = [5, 10];

  // table
  @ViewChild('scroll') scrollView!: ScrollPanel;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns: string[] = ['name', 'finishedPercent'];
  evaluationsColumns: string[] = [];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'participantIds') {
          this.participantIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
      }
    }
  }

  constructor(private _reportApi: ReportApiService) { }

  ngOnInit(): void {
    this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  loadChart(idProcess: number, evaluations: number[], participants: number[]) {
    this._reportApi.fetchProcessParticipantsScoreTable({ idProcess, evaluations, participants })
      .subscribe((resp: ResponseApi) => {
        this.displayedColumns = [...resp.result.columns];
        this.evaluationsColumns = [...resp.result.columns];
        this.displayedColumns.unshift("name");
        this.displayedColumns.push('finishedPercent');
        this.displayedColumns.push('avgScore');
        this.dataSource.data = resp.result.table;

        // fix scroll bar
        const realTableHeight = this.calculateTableHeight(this.dataSource.data.length, this.pageSizes[0]);
        this.scrollTableSize.height = realTableHeight;
        this.scrollView.refresh();
      });
  }
  onChangePaginator(event: PageEvent) {
    const realTableHeight = this.calculateTableHeight(event.length, event.pageSize);
    this.scrollTableSize.height = realTableHeight;
    this.scrollView.refresh();
  }
  calculateTableHeight(len: number, pageSize: number): string {
    const headerHeight = 35 + 55;
    const rowHeight = 50;
    if (len < pageSize) {
      return (len * rowHeight) + headerHeight + 'px';
    } else {
      return (pageSize * rowHeight) + headerHeight + 'px';
    }
  }
  generateCellClass(value: number) {
    if (value !== null && value < 0.45) {
      return 'range-1';
    }
    if (value >= 0.45 && value < 0.65) {
      return 'range-2';
    }
    if (value >= 0.65 && value < 0.85) {
      return 'range-3';
    }
    if (value >= 0.85) {
      return 'range-4';
    }
    return '';
  }

}
// ------------ CHART SCORE VS TIME ------------------
interface ParticipantEvaluatinAvg {
  avgScore: number;
  avgTime: number;
  countFinished: number;
  idMembership: number;
  noEvaluations: number;
  name: string;
}
@Component({
  selector: 'app-report-participants-avg-score-time',
  templateUrl: './report-participants-avg-score-time.component.html',
  styleUrls: ['./report-participants.component.scss']
})
export class ReportParticipantsAvgScoreTimeComponent implements OnInit, OnChanges {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];
  @Input() participantIds: number[] = [];

  basicData: any;
  basicOptions: any;
  data: ParticipantEvaluatinAvg[] = [];
  pluginsChartjs: any = [ChartDataLabels, {
    afterDatasetUpdate: (chart: any, idx: any) => {
      chart.getDatasetMeta(idx.index).data.forEach((v: any) => {
        if(v._model.radius === 0) {
          v._model.radius = 1;
        }
        v._model.radius *= 1.6;
        v._options.hoverRadius = v._model.radius;
      })
    }
  }];
  scale = 0.7;

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'participantIds') {
          this.participantIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
      }
    }
  }

  constructor(private _reportApi: ReportApiService, private reportParticipnatsService: ReportParticipantsService) { }

  ngOnInit() {
    this.basicData = {
      labels: [],
      datasets: []
    };
    this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
    this.basicOptions = {
      responsive: true,
      layout: {
        padding: {
          top: 50,
          right: 0
        }
      },
      legend: {
        display: false,
        position: 'bottom',
        align: 'left',
        fontFamily: 'Century Gothic'
      },
      scales: {
        xAxes: [{
          ticks: {
            fontColor: '#495057',
            beginAtZero: true,
            max: 10,
            fontFamily: 'Century Gothic'
          },
          scaleLabel: {
            display: true,
            labelString: 'Minutos promedio',
            fontFamily: 'Century Gothic'
          }
        }],
        yAxes: [{
          ticks: {
            fontColor: '#495057',
            beginAtZero: true,
            max: 1,
            fontFamily: 'Century Gothic'
          },
          scaleLabel: {
            display: true,
            labelString: 'Puntaje promedio',
            fontFamily: 'Century Gothic'
          }
        }]
      },
      plugins: {
        datalabels: {
          display: true,
          anchor: (context: any) => {
            var value = context.dataset.data[context.dataIndex];
            return value.r < 7 ? 'end' : 'center';
          },
          align: (context: any) => {
            var value = context.dataset.data[context.dataIndex];
            return value.r < 7 ? 'end' : 'center';
          },
          color: (context: any) => {
            var value = context.dataset.data[context.dataIndex];
            return value.r <= 7 ? context.dataset.backgroundColor : 'white';
          },
          font: {
            weight: 'bold',
            size: 9
          },
          formatter: (value: any, context: any) => {
            const name: string = context.dataset.label;
            const partsName: string[] = name.split(' ').filter(i => i !== '');
            let shortName = context.dataset.label;
            if(partsName.length === 2) {
              shortName = `${partsName[0].substring(0, 1)}${partsName[1].substring(0, 1)}`;
            }
            if(partsName.length === 3 || partsName.length === 4) {
              shortName = `${partsName[0].substring(0, 1)}${partsName[2].substring(0, 1)}`;
            }
            if(partsName.length > 4) {
              shortName = `${partsName[0].substring(0, 1)}${partsName[1].substring(0, 1)}`;
            }
            return shortName;
          },
          offset: 10,
          padding: 0,
          borderRadius: 0,
        }
      },
      tooltips: {
        intersect: true,
        callbacks: {
          title: function (tooltipItem: any, data: any) {
            return data['labels'][tooltipItem[0]['datasetIndex']];
          },
          label: function (tooltipItem: any, data: any) {
            return `Puntaje: ${tooltipItem['yLabel']}   Tiempo: ${tooltipItem['xLabel']} min`;
          },
          afterLabel: (tooltipItem: any, data: any) => {
            const datasetIndex = tooltipItem['datasetIndex'];
            const itemData = data['datasets'][datasetIndex]['data'][0];
            return `Evaluaciones terminadas: ${Math.round(itemData.r / this.scale)}`;
          }
        },
        displayColors: false
      },
      animation: {
        onComplete: (animation: any) => {
          this.fetchChartsCanvas();
        }
      }
    };
  }
  loadChart(idProcess: number, evaluations: number[], participants: number[]) {
    this._reportApi.fetchParticipantsEvaluationAvgScoreAvgTime({ idProcess, evaluations, participants })
      .subscribe((resp: ResponseApi) => {
        const noEvaluations = resp.result.noEvaluations;
        this.data = resp.result.participants;
        const basicData = {
          labels: this.data.map(i => i.name),
          datasets: this.data.map(i => {
            return {
              label: i.name,
              data: [{
                x: i.avgTime,
                y: i.avgScore,
                r: i.countFinished * this.scale
              }],
              borderColor: COLOR_CHART_BORDER,
              backgroundColor: COLOR_CHART_FILL,
              offset: 6 + i.avgTime,
            };
          })
        };
        this.basicData = basicData;
      });
  }
  fetchChartsCanvas() {
    const domObj: any = document.querySelector('#chartScoreTIme .chartjs-render-monitor');
    const config = {
      logging: false,
      width: domObj?.clientWidth,
      height: domObj?.clientHeight,
      scrollY: -window.scrollY,
      scrollX: 0,
      Usecors: true,
      scale: 4
    };
    html2canvas(domObj, config).then((canvas: any) => {
      this.reportParticipnatsService.canvasScoreTime = canvas.toDataURL();
    });
  }
}
// ------------ CHART ANSWER TYPES ------------------
export interface AnswerTypeElement {
  name: string;
  correct: number;
  incorrect: number;
  unknown: number;
  empty: number;
  score: number;
  max: number;
  codeEvaluation: number;
  nameEvaluation: string;
}
@Component({
  selector: 'app-report-participants-answer-types',
  templateUrl: './report-participants-answer-types.component.html',
  styleUrls: ['./report-participants.component.scss']
})
export class ReportParticipantsAnswerTypesComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];
  @Input() participantIds: number[] = [];

  stackedData: any;
  stackedOptions: any;
  data: any[] = [];
  originalData: any[] = [];
  evaluationsOptions: any[] = [];
  evaluationSelected!: any;
  pluginsChartjs: any = [ChartDataLabels];

  // mat-table
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns: string[] = ['index', 'name', 'chart', 'correct', 'incorrect', 'unknown', 'empty'];
  dataSource: MatTableDataSource<AnswerTypeElement> = new MatTableDataSource<AnswerTypeElement>([]);

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'participantIds') {
          this.participantIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
      }
    }
  }

  constructor(private _reportApi: ReportApiService) { }

  ngOnInit(): void {

    this.stackedOptions = {
      indexAxis: 'y',
      tooltips: {
        mode: 'index',
        intersect: false
      },
      layout: {
        padding: {
          left: 20,
          right: 20
        }
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: false,
          scaleLabel: {
            display: false,
            labelString: 'No. de preguntas',
          },
          ticks: {
            stepSize: 1,
            max: 10,
            fontFamily: 'Century Gothic',
            display: false //this will remove only the label
          },
          gridLines: {
            color: "rgba(0, 0, 0, 0)",
          }
        }],
        yAxes: [{
          stacked: false,
          scaleLabel: {
            display: false,
            labelString: 'Evaluaciones'
          },
          maxBarThickness: 64,
          ticks: {
            fontFamily: 'Century Gothic',
            display: true //this will remove only the label
          },
          gridLines: {
            color: "rgba(0, 0, 0, 0)",
          }
        }]
      },
      legend: {
        display: false
      }
    };

    this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  loadChart(idProcess: any, evaluations: number[], participants: number[]) {
    this._reportApi.fetchParticipantAnswerTypesAndScores({ idProcess, evaluations, participants })
      .subscribe((resp: ResponseApi) => {
        // fetch data
        this.data = [...resp.result];
        // complete a¡max & chart
        const auxData: AnswerTypeElement[] = this.data.map(i => {
          const ratios: number[] = [i.correct, i.incorrect, i.empty, i.unknown];
          const newItemData: AnswerTypeElement = {
            ...i,
            chart: this.getItemChartData(i),
            max: _.max(ratios, function (i) { return i; })
          }
          return newItemData;
        });
        this.originalData = auxData;
        // to chart same length
        const totalMax: any = _.max(this.originalData, function (i) { return i.max; });
        this.stackedOptions.scales.xAxes[0].ticks.max = totalMax.max;
        // fetch evaluations options
        this.evaluationsOptions = [];
        this.originalData.forEach(i => {
          const exist = this.evaluationsOptions.some(j => j.codeEvaluation === i.codeEvaluation);
          if (!exist) {
            this.evaluationsOptions.push(i);
          }
        });
        this.evaluationsOptions = this.evaluationsOptions.map(k => {
          return {
            code: k.codeEvaluation,
            label: k.nameEvaluation
          };
        });
        this.evaluationSelected = this.evaluationsOptions.length > 0 ? this.evaluationsOptions[0].code : null;
        // fill table
        this.dataSource.data = [
          ...this.originalData.filter(k => k.codeEvaluation === this.evaluationSelected)
        ];
      });
  }
  getItemChartData(item: any) {
    return {
      labels: ['Correctas', 'Incorrectas', 'No conozco la respuesta', 'Sin contestar'],
      datasets: [{
        label: 'Tipo de preguntas',
        backgroundColor: [COLOR_THEME_1, COLOR_THEME_2, COLOR_THEME_3, COLOR_GRAY_LIGHT],
        data: [item.correct, item.incorrect, item.unknown, item.empty],
        datalabels: {
          color: COLOR_THEME_1,
          display: true,
          font: {
            weight: 'bold',
            size: 9
          },
          formatter: (value: any, context: any) => {
            return value;
          },
          anchor: 'end',
          align: 'end',
          offset: 3
        }
      }]
    };
  }
  onChangeEvaluation() {
    this.dataSource.data = [
      ...this.originalData.filter(k => k.codeEvaluation === this.evaluationSelected)
    ];
  }

}
// ------------ DASHBOARD FILTERS ----------------
@Component({
  selector: 'app-report-participants-filters',
  templateUrl: './report-participants-filters.component.html',
  styleUrls: ['./report-participants.component.scss']
})
export class ReportParticipantsFiltersComponent implements OnInit, OnChanges {

  @Input() idAccount!: number;
  @Input() idProcess!: number;
  @Output() submitted = new EventEmitter<any>();

  process: any[] = [];
  evaluations: any[] = [];
  participants: any[] = [];
  selectedProcessId!: number;
  selectedEvaluations: any[] = [];
  selectedParticipants: any[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to = JSON.stringify(changedProp.currentValue);
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.loadData(this.idAccount, to);
        }
      }
    }
  }

  constructor(private _reportApi: ReportApiService) { }

  ngOnInit(): void {
    this.selectedProcessId = this.idProcess;
    this.loadData(this.idAccount, this.idProcess);
  }
  loadData(idAccount: any, idProcess: any) {
    const request: any = {
      idAccount,
      idProcess
    };
    this._reportApi.fetchProcessParticipantsFilters(request).subscribe((resp: ResponseApi) => {
      this.process = resp.result.process;
      this.evaluations = resp.result.evaluations;
      this.participants = resp.result.participants;
      this.selectedEvaluations = resp.result.evaluations.map((i: any) => i.id);
      this.selectedParticipants = resp.result.participants.map((i: any) => i.id);
    });
  }
  onSubmit() {
    this.submitted.emit({
      idProcess: this.selectedProcessId,
      evaluations: this.selectedEvaluations,
      participants: this.selectedParticipants
    });
  }
  onChangeProcess() {
    this.loadData(this.idAccount, this.selectedProcessId);
  }
}
// ------------ DASHBOARD BTN DOWNLOAD EXCEL ----------------
@Component({
  selector: 'app-report-participants-btn-download-excel',
  templateUrl: './report-participants-btn-download-excel.component.html',
  styleUrls: ['./report-participants.component.scss'],
  providers: [PipeFormatNamesPipe]
})
export class ReportParticipantsBtnDownloadExcelComponent implements OnInit, OnChanges {
  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];
  @Input() participantIds: number[] = [];

  basicData: any;
  basicOptions: any;
  data: any[] = [];
  displayedColumns: string[] = ['name', 'finishedPercent'];
  evaluationsColumns: string[] = [];
  newLabelAccount!: string;

  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'participantIds') {
          this.participantIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
      }
    }
  }
  constructor(private _reportApi: ReportApiService,
    private readonly _storage: StorageService,
    private pipeFormatNames: PipeFormatNamesPipe) {
    this.newLabelAccount = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE)?.account;
  }
  ngOnInit(): void {
    this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
  }
  loadChart(idProcess: number, evaluations: number[], participants: number[]) {
    this._reportApi.fetchProcessParticipantsRawScoreTable({ idProcess, evaluations, participants })
      .subscribe((resp: ResponseApi) => {
        this.displayedColumns = [...resp.result.columns];
        this.evaluationsColumns = [...resp.result.columns];
        this.displayedColumns.unshift("Apellido");
        this.displayedColumns.unshift("Nombre");
        this.displayedColumns.unshift("Id");
        this.displayedColumns.unshift("No.");
        this.data = resp.result.table;
      }, err => {
        console.log(err);
      });
  }
  get rawDataTable(): any[] {
    const dataTable: any[] = this.data.map((i: any, ydx: number) => {
      const rowArray: any[] = [];
      this.displayedColumns.forEach((col: string, idx: number) => {
        switch(col) {
          case 'Apellido':
            rowArray.push(this.pipeFormatNames.transform(i['lastname']));
            break;
          case 'Nombre':
            rowArray.push(this.pipeFormatNames.transform(i['name']));
            break;
          case 'Id':
            rowArray.push(i['dni']);
            break;
          case 'No.':
            rowArray.push(ydx + 1);
            break;
          default:
            rowArray.push(i[col]);
        }
      });
      return rowArray;
    });
    return dataTable;
  }
  download() {
    var imageLogoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAABLCAMAAAA2/q7vAAAC7lBMVEUAAAD/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////jtXoAAAA+XRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlbXF1eX2Bi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';
    //create new excel work book
    let workbook = new Workbook();
    // metadata
    workbook.creator = 'Databits';
    workbook.lastModifiedBy = 'Databits';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.lastPrinted = new Date();
    //add name to sheet
    let worksheet = workbook.addWorksheet("Reporte");
    const emptyCol = worksheet.getColumn('A');
    emptyCol.width = 3;
    // add brand
    const rowBrand = worksheet.addRow(['']);
    rowBrand.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '7030A0' },
      bgColor: { argb: '7030A0' }
    };
    rowBrand.height = 40;
    const imageId2 = workbook.addImage({
      base64: imageLogoBase64,
      extension: 'png',
    });
    worksheet.addImage(imageId2, {
      tl: { col: 1, row: 0.3 },
      ext: { width: 150, height: 34 }
    });
    
    // add compnay name
    const cellCompanyLabel = worksheet.getCell('B3');
    cellCompanyLabel.value = 'Cliente:';
    cellCompanyLabel.font = {
      name: 'Century Gothic',
      color: { argb: '313131' },
      size: 10,
      bold: true
    };
    worksheet.mergeCells('C3:E3');
    const cellCompanyName = worksheet.getCell('C3');
    cellCompanyName.value = this.newLabelAccount;
    cellCompanyName.font = {
      name: 'Century Gothic',
      color: { argb: '313131' },
      size: 10,
      bold: false
    };
    cellCompanyName.alignment = { vertical: 'bottom', horizontal: 'center' };
    // table
    worksheet.addTable({
      name: 'Reporte',
      ref: 'B5',
      headerRow: true,
      totalsRow: false,
      style: {
        theme: 'TableStyleLight5',
        showRowStripes: true,
      },
      columns: this.displayedColumns.map(col => {
        return {name: col,  style: { font: { name: 'Century Gothic', size: 10 } }};
      }),
      rows: this.rawDataTable,
    });
    // notes
    worksheet.addRow([]);
    const noteABrand = worksheet.addRow(['', 'Nota: El puntaje por evaluación se encuentra dentro del rango de 0 a 1, ha sido penalizado por un factor de corrección al existir una respuesta incorrecta']);
    // const noteNBrand = worksheet.addRow(['', 'Para la obtención de los scores por perfiles y herramientas se ponderó con un peso mayor a los conocimientos básicos o fundamentales']);
    noteABrand.font = {
      name: 'Century Gothic',
      color: { argb: '313131' },
      size: 10,
      bold: false
    };
    /*noteNBrand.font = {
      name: 'Century Gothic',
      color: { argb: '313131' },
      size: 10,
      bold: false
    };*/
    //set downloadable file name
    let fname = "Databits - Reporte de resultados - " + this.newLabelAccount;

    //add data and file name and download
    workbook.xlsx.writeBuffer().then((data: any) => {
      let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, fname + '-' + new Date().valueOf() + '.xlsx');
    }).catch(err => {
      console.log(err);
    });
  }
}
// ------------ DASHBOARD BTN DOWNLOAD PDF ----------------
@Component({
  selector: 'app-report-participants-btn-download-pdf',
  templateUrl: './report-participants-btn-download-pdf.component.html',
  styleUrls: ['./report-participants.component.scss'],
  providers: [PipeFormatNamesPipe]
})
export class ReportParticipantsBtnDownloadPdfComponent implements OnInit, OnChanges {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];
  @Input() participantIds: number[] = [];
  @Input() processSelected!: ProcessApp;
  @Input() hasDataPersonasEvaluation!: boolean;
  @ViewChild('imgLogoTalentbits') imgLogoTalentbits!: ElementRef;
  imgLogoTalentbitsBase64 = '';
  @Input() types!: Catalog[];
  @Input() archetypes!: Catalog[];
  accountSelected: AccountResume = Object.create({});
  displayedColumns: string[] = ['name', 'finishedPercent'];
  evaluationsColumns: string[] = [];
  scoreData: any[] = [];
  answersData: any[] = [];
  dataPersonasData: any[] = [];
  disableBtn = true;

  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'participantIds') {
          this.participantIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'processSelected') {
          const auxProcess = to;
          setTimeout(() => {
            this.processSelected = auxProcess;
          }, 50);
        }
        if (propName === 'hasDataPersonasEvaluation') {
          this.hasDataPersonasEvaluation = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
      }
    }
  }
  constructor(private _reportApi: ReportApiService,
    private readonly _storage: StorageService,
    private reportParticipantsService: ReportParticipantsService,
    private pipeFormatNames: PipeFormatNamesPipe) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
  }
  ngOnInit(): void {
    this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
    setTimeout(() => {
      this.disableBtn = false;
    }, 3000);
  }
  ngAfterViewInit(): void {
    const imgLogoTalentbits = this.imgLogoTalentbits.nativeElement;
    imgLogoTalentbits.addEventListener('load', (event: { currentTarget: ImageBitmap; }) => {
      this.imgLogoTalentbitsBase64 = this.getDataUrl(event.currentTarget);
    });
  }
  loadChart(idProcess: number, evaluations: number[], participants: number[]) {
    const getSocoreTable$ = this._reportApi.fetchProcessParticipantsScoreTable({ idProcess, evaluations, participants });
    const getAnswerTypes$ = this._reportApi.fetchParticipantAnswerTypesAndScores({ idProcess, evaluations, participants });
    const getDataPersonasData$ = this._reportApi.fetchDataPersonasParticipantsTable({ idProcess, evaluations, participants });
    zip(getSocoreTable$, getAnswerTypes$, getDataPersonasData$).subscribe((resp: ResponseApi[]) => {
      const socoreDataResponse: any = resp[0].result;
      this.displayedColumns = [...socoreDataResponse.columns];
      this.evaluationsColumns = [...socoreDataResponse.columns];
      this.displayedColumns.unshift("name");
      this.displayedColumns.push('finishedPercent');
      this.displayedColumns.push('avgScore');
      this.scoreData = socoreDataResponse.table;
      this.answersData = [...resp[1].result.sort((a: any, b: any) => b.correct - a.correct)];
      if (this.hasDataPersonasEvaluation) {
        this.dataPersonasData = resp[2].result;
      }
    });
  }
  getDataUrl(img: ImageBitmap) {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // Set width and height
    canvas.width = img.width;
    canvas.height = img.height;
    // Draw the image
    ctx?.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  }
  download() {
    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 75, 40, 60], // margin: [left, top, right, bottom]
      header: this.header,
      footer: this.footer,
      content: this.content,
      styles: {
        tableOne: {
          margin: [40, 20, 40, 15]
        },
        small: {
          fontSize: 8,
          color: '#8c8c8c'
        },
        header: {
          fontSize: 12,
          bold: true,
          color: '#5a5a5a'
        },
        subheader: {
          fontSize: 10,
          bold: true,
          color: '#8c8c8c'
        },
        cardValue: {
          color: '#02779b',
          bold: true,
          fontSize: 14
        },
        tableRow: {
          margin: [0, 15, 0, 15]
        },
        tableData: {
          margin: [0, 5, 0, 0]
        },
        cardLabel: {
          color: '#5a5a5a',
          bold: false,
          fontSize: 7
        },
        rowDataValue: {
          color: '#5a5a5a',
          bold: false,
          fontSize: 7
        },
        tableHeader: {
          fontSize: 10,
          bold: true,
          color: '#8c8c8c'
        },
        rowDataLabel: {
          color: '#5a5a5a',
          bold: true,
          fontSize: 8
        },
        rowDataValueWh: {
          color: '#fff',
          bold: true,
          fontSize: 7
        }
      }
    };
    var pdf = pdfMake.createPdf(docDefinition);
    var pdfName = 'Talentbits - ' + this.processSelected.name + '-' + moment(new Date()).format(FORMAT_DATE_PDF) + '.pdf';
    pdf.download(pdfName);
  }
  get header() {
    return {
      style: 'tableOne',
      table: {
        widths: ['*', 'auto'],
        body: [
          [{
            image: this.imgLogoTalentbitsBase64,
            width: 100
          },
          {
            text: moment(new Date()).format(FORMAT_DATE_PDF),
            margin: [0, 13, 0, 0],
            alignment: 'center',
            fontSize: 8,
            color: '#5c5c5c'
          }],
        ],
      },
      layout: 'noBorders'
    };
  }
  get footer() {
    return (currentPage: any, pageCount: any) => {
      return {
        margin: [25, 25, 25, 0],
        columns: [
          { text: '', alignment: 'left', style: 'small' },
          { text: currentPage.toString() + ' de ' + pageCount, alignment: 'right', style: 'small' }
        ]
      };
    };
  }
  get content() {
    return [
      {
        text: this.processSelected.name,
        style: 'header'
      },
      {
        text: this.getProcessTypeLabel(this.processSelected.type),
        style: 'subheader'
      },
      {
        text: this.accountSelected.account,
        style: 'subheader'
      },
      {
        unbreakable: true,
        layout: 'noBorders',
        style: 'tableRow',
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: 'Puntaje promedio vs Tiempo promedio',
                style: 'cardValue',
                alignment: 'center',
                margin: [0, 20, 0, 0],
              }
            ], [
              {
                image: this.reportParticipantsService.canvasScoreTime,
                margin: [0, 0, 0, 0],
                alignment: 'center',
                width: 514 // half
              }
            ]
          ]
        }
      },
      {
        table: {
          style: 'tableRow',
          widths: ['*'],
          body: [
            [
              {
                text: 'Puntajes por evaluación',
                style: 'cardValue',
                alignment: 'center',
                margin: [0, 20, 0, 0],
              }
            ],
            [
              {
                style: 'tableExample',
                layout: 'noBorders',
                margin: [324, 0, 0, 0],
                table: {
                  body: [
                    [
                      { text: 'Senior\nmayor a 0.85', style: 'rowDataValue', alignment: 'center', fillColor: this.generateCellColors(0.9) },
                      { text: 'Mid-Senior\n0.65 a 0.85', style: 'rowDataValue', alignment: 'center', fillColor: this.generateCellColors(0.7) },
                      { text: 'Junior\n0.45 a 0.64', style: 'rowDataValue', alignment: 'center', fillColor: this.generateCellColors(0.5) },
                      { text: 'No alcanza a junior\nmenor a 0.45', style: 'rowDataValue', alignment: 'center', fillColor: this.generateCellColors(0.3) },
                   ]
                  ]
                }
              }
            ],
            ...this.scoreTables
          ]
        },
        layout: 'noBorders'
      },
      {
        style: 'tableRow',
        layout: 'noBorders',
        unbreakable: false,
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: 'Conteo por tipo de respuestas',
                style: 'cardValue',
                alignment: 'center',
                margin: [0, 20, 0, 0],
              }
            ],
            ...this.answerTypesTables
          ]
        }
      }, {
        style: 'tableRow',
        layout: 'noBorders',
        unbreakable: false,
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: 'Cultura Analítica: Análisis Data Personas',
                style: 'cardValue',
                alignment: 'center',
                margin: [0, 20, 0, 0],
              }
            ], 
            [
              {
                style: 'tableExample',
                layout: 'noBorders',
                margin: [0, 0, 0, 0],
                table: {
                  body: [
                    [
                      { text: 'Data Champion', style: 'rowDataValueWh', alignment: 'center', fillColor: this.generateCellColorsDataPersonas('dataChampion') },
                      { text: 'Data Knight', style: 'rowDataValueWh', alignment: 'center', fillColor: this.generateCellColorsDataPersonas('dataKnight') },
                      { text: 'Data Dreamer', style: 'rowDataValueWh', alignment: 'center', fillColor: this.generateCellColorsDataPersonas('dataDreamer') },
                      { text: 'Data Doubter', style: 'rowDataValueWh', alignment: 'center', fillColor: this.generateCellColorsDataPersonas('dataDoubter') },
                   ], [
                    { text: 'Confían en los datos y saben emplearlos en la toma de decisiones. Sus conocimientos técnicos los convierte en campeones a la hora de analizar datos.', style: 'rowDataValueWh', alignment: 'center', fillColor: this.generateCellColorsDataPersonas('dataChampion') },
                    { text: 'Son expertos en la lucha contra los datos, pero su armadura no es a prueba de balas y frecuentemente se sienten abrumados por el aumento constante de los datos disponibles.', style: 'rowDataValueWh', alignment: 'center', fillColor: this.generateCellColorsDataPersonas('dataKnight') },
                    { text: 'Son entusiastas que reconocen la importancia de trabajar con datos; sin embargo, no saben cómo interrogarlos correctamente. Necesitan mejorar sus habilidades con los datos.', style: 'rowDataValueWh', alignment: 'center', fillColor: this.generateCellColorsDataPersonas('dataDreamer') },
                    { text: 'En su opinión, los procesos automatizados y las decisiones basadas en datos no son rival para la intuición. Prefieren dejar el análisis a los expertos en datos.', style: 'rowDataValueWh', alignment: 'center', fillColor:  this.generateCellColorsDataPersonas('dataDoubter')  },
                   ]
                  ]
                }
              }
            ],
            [this.dataPersonasTable]
          ]
        }
      }
    ];
  }
  get scoreTables() {
    // 1) calculate No o Tables
    const chunk: number = 5;
    const columnChunks: string[][] = _.chunk(this.evaluationsColumns, chunk);
    // 2) create body for each chunk
    const completeColumnChunks: string[][] = columnChunks.map((colnames: string[], idx: number) => {
      // displayed columns
      colnames.unshift("name");
      colnames.push('finishedPercent');
      colnames.push('avgScore');
      return colnames;
    });
    // add headers styles
    const completeColumnChunksWithFormat: any[][] = completeColumnChunks.map((colnames: string[], idx: number) => {
      return colnames.map(text => {
        return { text: text, style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] };
      });
    });
    // 3) for each complete chunk columns add bodies
    const tableCompleteChunk: any[] = completeColumnChunksWithFormat.map((colnames: any[], tblIndex: number) => {
      // add header
      const title = [{text: `Grupo de evaluaciones ${tblIndex + 1}`, style: 'tableHeader', colSpan: colnames.length, alignment: 'left'}, ..._.range(colnames.length - 1).map(col => {})];
      const tableData: any[] = [title, colnames];
      // add row data
      const orderData: any[] = this.scoreData.sort((a: any, b: any) => b.avgScore - a.avgScore);
      orderData.forEach(item => {
        const row: any[] = [];
        colnames.forEach((colname: any, yid: number) => {
          let cellValue: any = item[colname.text];
          let align: string = 'left';
          let bgColor = '#fff';
          if (colname.text === 'name') {
            cellValue = this.pipeFormatNames.transform(cellValue);
          }
          if (_.isNumber(item[colname.text])) {
            cellValue = cellValue.toFixed(2);
            align = 'center';
            bgColor = this.generateCellColors(cellValue);
            if (colname.text === 'finishedPercent') {
              cellValue = (cellValue * 100).toFixed(2) + '%';
              bgColor = '#fff';
            }
          }
          row.push({ text: cellValue, style: 'rowDataValue', alignment: align, fillColor: bgColor });
        });
        tableData.push(row);
      });
      // replace keys header
      tableData[1] = tableData[1].map((header: any) => {
        if (header.text === 'name') {
          header.text = 'Nombre';
        }
        if (header.text === 'finishedPercent') {
          header.text = 'Evaluaciones Completadas %';
        }
        if (header.text === 'avgScore') {
          header.text = 'Puntaje Promedio';
        }
        return header;
      });
      return tableData;
    });
    // 4) generate table formats for each chunk
    const tablesWithFormatPdf = tableCompleteChunk.map((bodyChunk: any[]) => {
      const columnCount = bodyChunk.length > 0 ? bodyChunk[0].length : 0;
      return [{
        style: 'tableData',
        unbreakable: false,
        table: {
          headerRows: 1,
          widths: _.range(columnCount).map(idx => '*'),
          body: bodyChunk
        },
        layout: 'lightHorizontalLines'
      }];
    });
    return tablesWithFormatPdf;
  }
  get answerTypesTables() {
    const bodyTemplate: any[] = [
      { text: 'No.', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
      { text: 'Participante', style: 'cardLabel', alignment: 'left', margin: [3, 3, 0, 3] },
      { text: 'Correctas', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
      { text: 'Incorrectas', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
      { text: 'No conozco la respuesta', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
      { text: 'Sin contestar', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] }
    ];
    // fecth evaluations
    let evaluationsOptions: any[] = [];
    this.answersData.forEach(i => {
      const exist = evaluationsOptions.some(j => j.codeEvaluation === i.codeEvaluation);
      if (!exist) {
        evaluationsOptions.push(i);
      }
    });
    evaluationsOptions = evaluationsOptions.map(k => {
      return {
        code: k.codeEvaluation,
        label: k.nameEvaluation
      };
    });
    // complete rows
    const tablesRawDataGroup = _.groupBy(this.answersData, (item) => item.codeEvaluation);
    const tablesFormatPdf: any = evaluationsOptions.map((evaluation: any) => {
      const title = [{text: evaluation.label, style: 'tableHeader', colSpan: 6, alignment: 'left'}, {}, {},{},{},{}];
      const iBody = [title, JSON.parse(JSON.stringify(bodyTemplate))];
      const tableEvaluation: any[] = tablesRawDataGroup[evaluation.code];
      tableEvaluation.forEach((item: any, idx: number) => {
        iBody.push([
          { text: idx + 1, style: 'rowDataLabel', alignment: 'center' },
          { text: this.pipeFormatNames.transform(item.name), style: 'rowDataLabel' },
          { text: item.correct.toFixed(0), style: 'rowDataValue', alignment: 'center' },
          { text: item.incorrect.toFixed(0), style: 'rowDataValue', alignment: 'center' },
          { text: item.unknown.toFixed(0), style: 'rowDataValue', alignment: 'center' },
          { text: item.empty.toFixed(0), style: 'rowDataValue', alignment: 'center' }
        ]);
      });
      return [{
        style: 'tableData',
        unbreakable: false,
        table: {
          // headerRows: 2,
          widths: [50, '*', '*', '*', '*', '*'],
          body: iBody
        },
        layout: 'lightHorizontalLines'
      }];
    });
    return tablesFormatPdf;
  }
  get dataPersonasTable() {
    const body: any[] = [
     [
      { text: 'Participante', style: 'cardLabel', alignment: 'left', margin: [3, 3, 0, 3] },
      { text: 'Data Champion', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
      { text: 'Data Knight', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
      { text: 'Data Dreamer', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
      { text: 'Data Doubter', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
      { text: 'Resultado', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] }
     ]
    ];
    this.dataPersonasData.forEach(item => {
      body.push([
        { text: this.pipeFormatNames.transform(item.name), style: 'rowDataLabel' },
        { text: item.dataChampion.toFixed(0), style: 'rowDataValue', alignment: 'center' },
        { text: item.dataKnight.toFixed(0), style: 'rowDataValue', alignment: 'center' },
        { text: item.dataDreamer.toFixed(0), style: 'rowDataValue', alignment: 'center' },
        { text: item.dataDoubter.toFixed(0), style: 'rowDataValue', alignment: 'center' },
        { text: this.getArchetypeLabelByValue(item.result), style: 'rowDataValueWh', alignment: 'center', fillColor: this.generateCellColorsDataPersonas(item.result) },
      ]);
    });
    
    return [{
      style: 'tableData',
      unbreakable: false,
      table: {
        // headerRows: 2,
        widths: [50, '*', '*', '*', '*', '*'],
        body: body
      },
      layout: 'lightHorizontalLines'
    }];
  }
  getProcessTypeLabel(code: number) {
    return this.types.find(i => i.code === code)?.label ?? 'NE';
  }
  generateCellColors(value: number) {
    if (value !== null && value < 0.45) {
      return '#f1f1f1';
    }
    if (value >= 0.45 && value < 0.65) {
      return '#f9e79f';
    }
    if (value >= 0.65 && value < 0.85) {
      return '#a6eff6';
    }
    if (value >= 0.85) {
      return '#cce4eb';
    }
    return '#fff';
  }
  generateCellColorsDataPersonas(value: string) {
    if (value === 'dataChampion') {
      return '#02779b';
    }
    if (value === 'dataKnight') {
      return '#7665E0';
    }
    if (value === 'dataDreamer') {
      return '#bab2ef';
    }
    if (value === 'dataDoubter') {
      return '#4da0b9';
    }
    return '#fff';
  }
  fetchChartsCanvas(id: string) {
    const domObj: any = document.querySelector(id);
    const config = {
      logging: false,
      width: domObj?.clientWidth,
      height: domObj?.clientHeight,
      scrollY: -window.scrollY,
      scrollX: 0,
      Usecors: true,
      scale: 4
    };
    html2canvas(domObj, config).then((canvas: any) => {
    });
  }
  getArchetypeLabelByValue(value: string) {
    const archetype = this.archetypes.find(i => i.value === value);
    return archetype !== undefined ? archetype.label : '';
  }

}
// ------------ DATA PERSONAS ----------------
@Component({
  selector: 'app-report-participants-data-personas-table',
  templateUrl: './report-participants-data-personas-table.component.html',
  styleUrls: ['./report-participants.component.scss'],
  providers: [PipeFormatNamesPipe]
})
export class ReportParticipantsDataPersonasComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];
  @Input() participantIds: number[] = [];
  @Input() archetypes: Catalog[] = [];

  data: any[] = [];

  // mat-table
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns: string[] = ['name', 'dataChampion', 'dataKnight', 'dataDreamer', 'dataDoubter', 'result'];
  dataSource: MatTableDataSource<AnswerTypeElement> = new MatTableDataSource<any>([]);

  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
        if (propName === 'participantIds') {
          this.participantIds = to;
          this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
        }
      }
    }
  }
  constructor(private _reportApi: ReportApiService) {}
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  ngOnInit(): void {
    this.loadChart(this.idProcess, this.evaluationIds, this.participantIds);
  }
  loadChart(idProcess: number, evaluations: number[], participants: number[]) {
    const getDataPersonasData$ = this._reportApi.fetchDataPersonasParticipantsTable({ idProcess, evaluations, participants });
    getDataPersonasData$
    .subscribe((resp: ResponseApi) => {
      this.data = [...resp.result];
      this.dataSource.data = [
        ...this.data
      ];
    });
  }
  getArchetypeLabelByValue(value: string) {
    const archetype = this.archetypes.find(i => i.value === value);
    return archetype !== undefined ? archetype.label : '';
  }
}