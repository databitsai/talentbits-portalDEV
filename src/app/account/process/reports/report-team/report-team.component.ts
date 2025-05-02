import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NgxSpinnerService } from 'ngx-spinner';
import { UIChart } from 'primeng/chart';
import { iif, Observable, of, Subscription, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { Catalog } from 'src/app/_models/Catalog';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { ReportApiService } from 'src/app/_services/api/report-api.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_PROCESS_STATE, CATALOG_PROJECT_TYPE, COLOR_CHART_BORDER, COLOR_CHART_FILL, COLOR_GRAY_LIGHT, COLOR_CHART_BG_GRAY1_TRANSPARENT, COLOR_THEME_1, COLOR_THEME_2, COLOR_THEME_3, COLOR_THEME_4, COLOR_THEME_7, PROCESS_SELECTED_ROUTE, STORAGE_LOCAL, FORMAT_DATE_PDF, FORMAT_CALENDAR_DATE, FORMAT_TIME_PDF, CATALOG_QUALIFICATION_ARCHETYPE } from 'src/app/_utils/constants';
import * as _ from 'underscore';
declare var ChartDataLabels: any;
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
(<any>pdfMake).vfs = pdfFonts.pdfMake.vfs;
import * as moment from 'moment';
import { PipeSecondsToMinutesPipe } from 'src/app/_shared/pipes/pipe-seconds-to-minutes.pipe';
import html2canvas from 'html2canvas';
import { ReportTeamService } from './report-team.service';
import { PercentPipe } from '@angular/common';

interface ProcessInfo {
  noEvaluations: number;
  noRequests: number;
  avgNoQuestions: number;
  avgScore: number;
  avgTimePerformed: number;
  hasDataPersonas: boolean;
}
interface StatusCount {
  count: number;
  label: string;
  statusCode: number;
  order: number;
  color: string;
}
interface ValueLabeled {
  value: number;
  label: string;
}
interface CountAnswersType {
  label: string;
  correct: number;
  incorrect: number;
  unknown: number;
  empty: number;
}
interface FilterSubmit {
  idProcess: number;
  evaluations: number[];
}

// ------------ MAIN ------------------
@Component({
  selector: 'app-report-team',
  templateUrl: './report-team.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamComponent implements OnInit {

  processSelected: ProcessApp = Object.create({});
  accountSelected: AccountResume = Object.create({});
  loading = true;
  idProcess!: number;
  processInfo!: ProcessInfo;
  evaluationIds: number[] = [];
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
    this._reportApi.processFetchResume({ idProcess: this.idProcess, evaluations: this.evaluationIds }).subscribe((resp: ResponseApi) => {
      this.processInfo = resp.result;
      this.processSelected = resp.result.process;
      this.hasDataPersonasEvaluation = this.processInfo.hasDataPersonas;
    });
  }
}
// ------------ CARD RESUME -----------------
@Component({
  selector: 'app-report-team-resume',
  templateUrl: './report-team-resume.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamResumeComponent implements OnInit, OnChanges {

  @Input() states!: Catalog[];
  @Input() processSelected!: ProcessApp;

  showStatus = true;

  constructor() { }

  ngOnInit(): void {
  }
  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to = JSON.stringify(changedProp.currentValue);
      if (!changedProp.isFirstChange()) {
        if (propName === 'processSelected') {
          const auxProcess = JSON.parse(to);
          this.showStatus = false;
          setTimeout(() => {
            this.processSelected = auxProcess;
            this.showStatus = true;
          }, 50);
        }
      }
    }
  }

  getProcessStateLabel(code: number) {
    return this.states.find(i => i.code === code)?.label ?? 'NE';
  }
  getProcessStateValue(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'default';
  }

}

// ------------- CARD VALUE --------------
@Component({
  selector: 'app-report-team-valuecard',
  templateUrl: './report-team-valuecard.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamValueCardComponent implements OnInit {

  @Input() value!: any;
  @Input() title!: string;
  @Input() icon!: string;

  constructor() { }

  ngOnInit(): void {
  }

}

// ------------ CARD BARCHART PARTICIPANTS ----------------
interface AppConfig {
  inputStyle?: string;
  dark?: boolean;
  theme?: string;
  ripple?: boolean;
}
@Component({
  selector: 'app-report-team-barchart-participants',
  templateUrl: './report-team-barchart-participants.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamBarchartParticipantsComponent implements OnInit, OnChanges {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];

  stackedData: any;
  stackedOptions: any;
  subscription!: Subscription;
  config!: AppConfig;
  loading = false;
  data: StatusCount[] = [];
  pluginsChartjs: any = [ChartDataLabels];

  constructor(private _reportApi: ReportApiService, private reportTeamService: ReportTeamService) { }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
      }
    }
  }

  ngOnInit(): void {

    this.stackedData = {
      labels: ['Participantes'],
      datasets: []
    };

    this.loadChart(this.idProcess, this.evaluationIds);

    this.stackedOptions = {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          fontFamily: 'Century Gothic'
        }
      },
      tooltips: {
        mode: 'index',
        intersect: false
      },
      responsive: true,
      scales: {
        xAxes: [{
          stacked: true,
          maxBarThickness: 64,
          ticks: {
            fontFamily: 'Century Gothic'
          }
        }],
        yAxes: [{
          display: false,
          stacked: true,
          min: 0,
          ticks: {
            stepSize: 2,
            beginAtZero: true,
            fontSize: 8,
            fontFamily: 'Century Gothic'
          }
        }]
      },
      plugins: {
        datalabels: {
          color: 'white',
          display: true,
          font: {
            weight: 'bold',
            size: 9
          },
          formatter: Math.round,
          anchor: 'start',
          align: 'bottom',
          offset: 3
        }
      },
      animation: {
        onComplete: (animation: any) => {
          this.fetchChartsCanvas();
        }
      }
    };
  }
  loadChart(id: any, evaluationIds: number[]): void {
    this.loading = true;
    this._reportApi.fetchProcessRequestStatusCount({ idProcess: this.idProcess, evaluations: evaluationIds })
      .subscribe((resp: ResponseApi) => {
        this.data = resp.result;
        const dataChart: any[] = this.data.map(status => {
          return {
            type: 'bar',
            label: status.label,
            backgroundColor: status.color,
            data: [
              status.count
            ]
          };
        });
        this.stackedData = {
          labels: ['Participantes'],
          datasets: [...dataChart]
        };
        this.loading = false;

      });
  }
  fetchChartsCanvas() {
    const domObj: any = document.querySelector('#barchartParticipants .chartjs-render-monitor');
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
      this.reportTeamService.canvasParticipants = canvas.toDataURL();
    });
  }
}
// ------------ CARD BARCHART AVG SCORE ----------------
@Component({
  selector: 'app-report-team-avg-score',
  templateUrl: './report-team-avg-score.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamAvgScoreComponent implements OnInit, OnChanges {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];

  basicData: any;
  basicOptions: any;
  data: ValueLabeled[] = [];
  avg: number = 0;
  pluginsChartjs: any = [ChartDataLabels];

  @ViewChild("chart") chart!: UIChart;

  constructor(private _reportApi: ReportApiService, private reportTeamService: ReportTeamService) { }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
      }
    }
  }

  ngOnInit(): void {

    this.basicData = {
      labels: [],
      datasets: [
        {
          label: 'Promedio',
          backgroundColor: '#42A5F5',
          data: []
        }
      ]
    };

    this.loadChart(this.idProcess, this.evaluationIds);

    this.basicOptions = {
      responsive: true,
      legend: {
        display: true,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          fontFamily: 'Century Gothic'
        }
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem: any, data: any) {
            const datasetIndex: number = tooltipItem.datasetIndex;
            const label: string = data.datasets[datasetIndex].label;
            return `${label}: ${(tooltipItem['xLabel'] * 100).toFixed(2)}%`;
          }
        },
        displayColors: true
      },
      scales: {
        xAxes: [{
          ticks: {
            fontColor: '#495057',
            beginAtZero: true,
            max: 1,
            callback: (value: any) => {
              return (value * 100).toFixed(0) + '%';
            },
            fontFamily: 'Century Gothic'
          },
          scaleLabel: {
            display: true,
            labelString: 'Puntaje promedio',
            fontFamily: 'Century Gothic'
          }
        }],
        yAxes: [{
          ticks: {
            fontColor: '#495057',
            fontSize: 11,
            fontFamily: 'Century Gothic'
          },
          scaleLabel: {
            display: true,
            labelString: 'Evaluaciones',
            fontFamily: 'Century Gothic'
          },
          maxBarThickness: 64
        }]
      },      
      animation: {
        onComplete: (animation: any) => {
          this.fetchChartsCanvas();
        }
      }
    };
  }
  loadChart(idProcess: number, evaluations: number[]) {
    this._reportApi.fetchProcessEvaluationAvgScore({ idProcess, evaluations })
      .subscribe((resp: ResponseApi) => {
        this.data = resp.result.values;
        this.avg = resp.result.avg;
        this.basicData = {
          labels: this.data.map(i => i.label),
          datasets: [
            {
              label: 'Promedio global',
              data: this.data.map(i => {
                return {
                  x: this.avg, y: i.label
                };
              }),
              type: 'line',
              borderColor: COLOR_THEME_7,
              backgroundColor: COLOR_THEME_7,
              datalabels: {
                display: false
              }
            },
            {
              label: 'Promedio por evaluación',
              backgroundColor: this.data.map(i => {
                if (i.value >= this.avg) {
                  return COLOR_THEME_1;
                }
                return COLOR_THEME_1;
              }),
              data: this.data.map(i => i.value),
              datalabels: {
                color: COLOR_THEME_1,
                display: true,
                font: {
                  weight: 'bold',
                  size: 9
                },
                formatter: (value: any, context: any) => {
                  return (value * 100).toFixed(2) + '%';
                },
                anchor: 'end',
                align: 'end',
                offset: 3
              }
            }
          ]
        };
      });
  }
  fetchChartsCanvas() {
    const domObj: any = document.querySelector('#barchartTeamAvgScore .chartjs-render-monitor');
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
      this.reportTeamService.canvasAvgScore = canvas.toDataURL();
    });
  }
}
// ------------ CARD BARCHART AVG TIME ----------------
@Component({
  selector: 'app-report-team-avg-time',
  templateUrl: './report-team-avg-time.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamAvgTimeComponent implements OnInit, OnChanges {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];

  basicData: any;
  basicOptions: any;
  data: ValueLabeled[] = [];
  avg: number = 0;

  @ViewChild("chart") chart!: UIChart;
  pluginsChartjs: any = [ChartDataLabels];

  constructor(private _reportApi: ReportApiService,
    private reportTeamService: ReportTeamService) { }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
      }
    }
  }

  ngOnInit(): void {
    this.basicData = {
      labels: [],
      datasets: [
        {
          label: 'Promedio',
          backgroundColor: '#42A5F5',
          data: []
        }
      ]
    };

    this.loadChart(this.idProcess, this.evaluationIds);

    this.basicOptions = {
      responsive: true,
      legend: {
        display: true,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          fontFamily: 'Century Gothic'
        }
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
            fontSize: 11,
            fontFamily: 'Century Gothic'
          },
          scaleLabel: {
            display: true,
            labelString: 'Evaluaciones',
            fontFamily: 'Century Gothic'
          },
          maxBarThickness: 64
        }]
      },
      animation: {
        onComplete: (animation: any) => {
          this.fetchChartsCanvas();
        }
      }
    };
  }
  loadChart(idProcess: number, evaluations: number[]) {
    this._reportApi.fetchProcessEvaluationAvgTime({ idProcess, evaluations })
      .subscribe((resp: ResponseApi) => {

        this.data = resp.result.values;
        this.avg = resp.result.avg;
        this.basicData = {
          labels: this.data.map(i => i.label),
          datasets: [
            {
              label: 'Promedio global',
              data: this.data.map(i => {
                return {
                  x: this.avg, y: i.label
                };
              }),
              type: 'line',
              borderColor: COLOR_THEME_7,
              backgroundColor: COLOR_THEME_7,
              datalabels: {
                display: false
              }
            },
            {
              label: 'Promedio por evaluación',
              backgroundColor: this.data.map(i => {
                if (i.value >= this.avg) {
                  return COLOR_THEME_1;
                }
                return COLOR_THEME_1;
              }),
              data: this.data.map(i => i.value),
              datalabels: {
                color: COLOR_THEME_1,
                display: true,
                font: {
                weight: 'bold',
                size: 9
                },
                formatter: (value: any, context: any) => {
                  return value + ' min';
                },
                anchor: 'end',
                align: 'end',
                offset: 3
              }
            }
          ]
        };
      });
  }
  fetchChartsCanvas() {
    const domObj: any = document.querySelector('#barchartTeamAvgTime .chartjs-render-monitor');
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
      this.reportTeamService.canvasAvgTime = canvas.toDataURL();
    });
  }

}
// ------------ CARD BARCHART ANSWERS TYPES ----------------
export interface AnswerTypeElement {
  label: string;
  correct: number;
  incorrect: number;
  unknown: number;
  empty: number;
  chart: any;
  max: number;
}
@Component({
  selector: 'app-report-team-answers-type',
  templateUrl: './report-team-answers-type.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamAnswersTypesComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];

  stackedData: any;
  stackedOptions: any;
  data: CountAnswersType[] = [];
  pluginsChartjs: any = [ChartDataLabels];

  // mat-table
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns: string[] = ['index', 'label', 'chart', 'correct', 'incorrect', 'unknown', 'empty'];
  dataSource: MatTableDataSource<AnswerTypeElement> = new MatTableDataSource<AnswerTypeElement>([]);

  constructor(private _reportApi: ReportApiService) { }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
      }
    }
  }

  ngOnInit(): void {

    this.stackedData = {
      labels: [],
      datasets: []
    };

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
            fontFamily: 'Century Gothic'
          },
          ticks: {
            stepSize: 1,
            max: 10,
            display: false, //this will remove only the label
            fontFamily: 'Century Gothic'
          },
          gridLines: {
            color: "rgba(0, 0, 0, 0)",
          }
        }],
        yAxes: [{
          stacked: false,
          scaleLabel: {
            display: false,
            labelString: 'Evaluaciones',
            fontFamily: 'Century Gothic'
          },
          maxBarThickness: 64,
          ticks: {
            display: true, //this will remove only the label
            fontFamily: 'Century Gothic'
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

    this.loadChart(this.idProcess, this.evaluationIds);

  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  loadChart(idProcess: any, evaluations: number[]) {
    this._reportApi.fetchProcessEvaluationAnswersType({ idProcess, evaluations })
      .subscribe((resp: ResponseApi) => {

        this.data = resp.result;
        const auxData: AnswerTypeElement[] = this.data.map(i => {
          const ratios: number[] = [i.correct, i.incorrect, i.empty, i.unknown];
          const newItemData: AnswerTypeElement = {
            ...i,
            chart: this.getItemChartData(i),
            max: _.max(ratios, function (i) { return i; })
          }
          return newItemData;
        });

        const totalMax: any = _.max(auxData, function (i) { return i.max; }); // to chart same length

        this.stackedOptions.scales.xAxes[0].ticks.max = totalMax.max;
        this.dataSource.data = auxData;

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

}
// ------------ DASHBOARD FILTERS ----------------
@Component({
  selector: 'app-report-team-filters',
  templateUrl: './report-team-filters.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamFiltersComponent implements OnInit, OnChanges {

  process: any[] = [];
  evaluations: any[] = [];
  selectedProcessId!: number;
  selectedEvaluations: any[] = [];

  @Input() idAccount!: number;
  @Input() idProcess!: number;
  @Output() submitted = new EventEmitter<FilterSubmit>();

  constructor(private _reportApi: ReportApiService) { }

  ngOnChanges(changes: SimpleChanges) {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to = JSON.stringify(changedProp.currentValue);
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          console.log(to);
          this.loadData(this.idAccount, to);
        }
      }
    }
  }

  ngOnInit(): void {
    this.selectedProcessId = this.idProcess;
    this.loadData(this.idAccount, this.idProcess);
  }
  loadData(idAccount: any, idProcess: any) {
    const request: any = {
      idAccount,
      idProcess
    };
    this._reportApi.fetchProcessTeamFilters(request).subscribe((resp: ResponseApi) => {
      this.process = resp.result.process;
      this.evaluations = resp.result.evaluations;
      this.selectedEvaluations = resp.result.evaluations.map((i: any) => i.id);
    });
  }
  onSubmit() {
    this.submitted.emit({
      idProcess: this.selectedProcessId,
      evaluations: this.selectedEvaluations
    });
  }
  onChangeProcess() {
    this.loadData(this.idAccount, this.selectedProcessId);
  }

}
// ------------ CARD SCORE VS TIME ----------------
@Component({
  selector: 'app-report-team-avg-score-time',
  templateUrl: './report-team-avg-score-time.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamAvgScoreAvgTimeComponent implements OnInit, OnChanges {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];

  basicData: any;
  basicOptions: any;
  data: any[] = [];
  pluginsChartjs: any = [
    ChartDataLabels, {
      afterDatasetUpdate: (chart: any, idx: any) => {
        chart.getDatasetMeta(idx.index).data.forEach((v: any) => {
          if (v._model.radius === 0) {
            v._model.radius = 1;
          }
          v._model.radius *= 1.6;
          v._options.hoverRadius = v._model.radius;
        })
      }
    }
  ];

  @ViewChild("chartScoreTime") chart!: UIChart;
  scale = 1.5;

  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
      }
    }
  }
  constructor(private _reportApi: ReportApiService, private reportTeamService: ReportTeamService) { }
  ngOnInit(): void {
    this.basicData = {
      labels: [],
      datasets: []
    };
    this.loadChart(this.idProcess, this.evaluationIds);
    this.basicOptions = {
      responsive: true,
      layout: {
        padding: {
          top: 50,
          right: 0
        }
      },
      legend: {
        display: true,
        position: 'bottom',
        align: 'left',
        maxWidth: 100,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          fontFamily: 'Century Gothic'
        }
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
            stepSize: 0.1,
            callback: (value: any) => {
              return (value * 100).toFixed(0) + '%';
            },
            fontFamily: 'Century Gothic'
          },
          scaleLabel: {
            display: true,
            labelString: 'Puntaje promedio',
            fontFamily: 'Century Gothic'
          }
        }]
      },
      tooltips: {
        callbacks: {
          title: function (tooltipItem: any, data: any) {
            return data['labels'][tooltipItem[0]['datasetIndex']];
          },
          label: function (tooltipItem: any, data: any) {
            return `Puntaje: ${(tooltipItem['yLabel'] * 100).toFixed(2)}%   Tiempo: ${tooltipItem['xLabel']} min`;
          },
          afterLabel: (tooltipItem: any, data: any) => {
            const datasetIndex = tooltipItem['datasetIndex'];
            const itemData = data['datasets'][datasetIndex]['data'][0];
            return `Respuestas correctas: ${Math.round(itemData.r)}`;
          }
        },
        displayColors: true
        /*backgroundColor: '#FFF',
        titleFontSize: 12,
        titleFontColor: COLOR_THEME_1,
        bodyFontColor: '#000',
        bodyFontSize: 10,
        displayColors: false*/
      },
      plugins: {
        datalabels: {
          display: false,
          anchor: (context: any) => {
            var value = context.dataset.data[context.dataIndex];
            return value.r < 36 ? 'end' : 'center';
          },
          align: (context: any) => {
            var value = context.dataset.data[context.dataIndex];
            return value.r < 36 ? 'end' : 'center';
          },
          color: (context: any) => {
            var value = context.dataset.data[context.dataIndex];
            return value.r <= 36 ? '#313131' : '#313131';
          },
          font: {
            weight: 'bold',
            size: 10
          },
          formatter: (value: any, context: any) => {
            return context.dataset.label;
          },
          offset: 18,
          padding: 3,
          borderRadius: 4,
          backgroundColor: COLOR_CHART_BG_GRAY1_TRANSPARENT
        }
      },
      animation: {
        onComplete: (animation: any) => {
          this.fetchChartsCanvas();
        }
      }
    };
  }
  loadChart(idProcess: number, evaluations: number[]) {
    const colors: string[] = [
      '#20A5D1', '#7665E0', '#4AF7D5', '#FFEBA7', '#5A5A5A', '#0D3DDE',
      '#04A4D9', '#C2BAF7', '#AAFCEC', '#FFC058', '#BAB9B9',
      '#02779b', '#988AEC', '#75FAE0', '#FFDA58', '#8A8A8A',
      '#015E7D', '#5945D1', '#21F2C9', '#E9C031', '#1D1D1D',
      '#01485F', '#3B25C0', '#00E5B8', '#BF9913', '#040303'
    ];
    this._reportApi.fetchProcessEvaluationAvgScoreAvgTime({ idProcess, evaluations })
      .subscribe((resp: ResponseApi) => {
        this.data = resp.result;
        const basicData = {
          labels: this.data.map(i => i.label),
          datasets: this.data.map((i: any, idx: number) => {
            return {
              label: i.label,
              data: [{
                x: i.time,
                y: i.score,
                r: i.correct
              }],
              borderColor: colors[idx % colors.length],
              backgroundColor: colors[idx % colors.length],
              offset: 6 + i.time
            };
          })
        };
        this.basicData = basicData;
      });
  }
  fetchChartsCanvas() {
    const domObj: any = document.querySelector('#chartScoreTime .chartjs-render-monitor');
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
      this.reportTeamService.canvasScoreTime = canvas.toDataURL();
    });
  }
}
// ------------ CARD TOP PARTICIPANTS ----------------
@Component({
  selector: 'app-report-team-participants-top',
  templateUrl: './report-team-participants-top.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamParticipantsTopComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];

  basicData: any;
  basicOptions: any;
  data: any[] = [];

  // mat-table
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  displayedColumns: string[] = ['index', 'name', 'value'];
  dataSource: MatTableDataSource<any> = new MatTableDataSource<any>([]);

  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadChart(this.idProcess, this.evaluationIds);
        }
      }
    }
  }
  constructor(private _reportApi: ReportApiService) { }
  ngOnInit(): void {
    this.loadChart(this.idProcess, this.evaluationIds);
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  loadChart(idProcess: number, evaluations: number[]) {
    this._reportApi.fetchParticipantsScoresByIdProcessOrdered({ idProcess, evaluations })
      .subscribe((resp: ResponseApi) => {
        this.dataSource.data = resp.result;
      });
  }
}
// ------------ DASHBOARD BTN DOWNLOAD PDF ----------------
@Component({
  selector: 'app-report-team-btn-download-pdf',
  templateUrl: './report-team-btn-download-pdf.component.html',
  styleUrls: ['./report-team.component.scss'],
  providers: [PipeSecondsToMinutesPipe, PercentPipe]
})
export class ReportTeamBtnDownloadPdfComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() idProcess!: number;
  @Input() evaluationIds: number[] = [];
  @Input() processSelected!: ProcessApp;
  @Input() states!: Catalog[];
  @Input() types!: Catalog[];
  @Input() archetypes!: Catalog[];
  @Input() processInfo!: ProcessInfo;
  @Input() chartCanvas!: any;
  @ViewChild('imgLogoTalentbits') imgLogoTalentbits!: ElementRef;
  @ViewChild('imgDataPersonasdataChampion') imgDataPersonasdataChampion!: ElementRef;
  @ViewChild('imgDataPersonasdataKnight') imgDataPersonasdataKnight!: ElementRef;
  @ViewChild('imgDataPersonasdataDreamer') imgDataPersonasdataDreamer!: ElementRef;
  @ViewChild('imgDataPersonasdataDoubter') imgDataPersonasdataDoubter!: ElementRef;
  imgLogoTalentbitsBase64 = '';
  imgDataPersonasdataChampionBase64 = '';
  imgDataPersonasdataKnightBase64 = '';
  imgDataPersonasdataDreamerBase64 = '';
  imgDataPersonasdataDoubterBase64 = '';
  topParticipantsTable: any[] = [];
  answerTypesTable: any[] = [];
  dataPersonasTable: any[] = [];
  accountSelected: AccountResume = Object.create({});
  enableButton = false;

  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.idProcess = to;
          this.loadData(this.idProcess, this.evaluationIds);
        }
        if (propName === 'evaluationIds') {
          this.evaluationIds = to;
          this.loadData(this.idProcess, this.evaluationIds);
        }
        if (propName === 'processSelected') {
          const auxProcess = to;
          setTimeout(() => {
            this.processSelected = auxProcess;
          }, 50);
        }
        if (propName === 'processInfo') {
          const auxProcess = to;
          setTimeout(() => {
            this.processInfo = auxProcess;
          }, 50);
        }
      }
    }
  }
  constructor(private pipeSecondsFormat: PipeSecondsToMinutesPipe,
    private pipePercent: PercentPipe,
    private reportTeamService: ReportTeamService,
    private _reportApi: ReportApiService,
    private readonly _storage: StorageService) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
  }
  ngOnInit(): void {
    this.loadData(this.idProcess, this.evaluationIds);
    setTimeout(() => {
      this.enableButton = true;
    }, 3500)
  }
  loadData(idProcess: number, evaluations: number[]) {
    const getTopParticipantsTable$: Observable<any> = this._reportApi.fetchParticipantsScoresByIdProcessOrdered({ idProcess, evaluations });
    const getAnswerTypesTable$: Observable<any> = this._reportApi.fetchProcessEvaluationAnswersType({ idProcess, evaluations });
    const getDataPersonasData$ = this._reportApi.fetchDataPersonasTeamTable({ idProcess, evaluations, participants: [] });
    zip(getTopParticipantsTable$, getAnswerTypesTable$, getDataPersonasData$).subscribe((resp: any[]) => {
      this.topParticipantsTable = resp[0].result;
      this.answerTypesTable = resp[1].result;
      this.dataPersonasTable = resp[2].result;
    });
  }
  ngAfterViewInit(): void {
    const imgLogoTalentbits = this.imgLogoTalentbits.nativeElement;
    imgLogoTalentbits.addEventListener('load', (event: { currentTarget: ImageBitmap; }) => {
      this.imgLogoTalentbitsBase64 = this.getDataUrl(event.currentTarget);
    });
    const imgDataPersonasdataChampion = this.imgDataPersonasdataChampion.nativeElement;
    imgDataPersonasdataChampion.addEventListener('load', (event: { currentTarget: ImageBitmap; }) => {
      this.imgDataPersonasdataChampionBase64 = this.getDataUrl(event.currentTarget);
    });
    const imgDataPersonasdataKnight = this.imgDataPersonasdataKnight.nativeElement;
    imgDataPersonasdataKnight.addEventListener('load', (event: { currentTarget: ImageBitmap; }) => {
      this.imgDataPersonasdataKnightBase64 = this.getDataUrl(event.currentTarget);
    });
    const imgDataPersonasdataDreamer = this.imgDataPersonasdataDreamer.nativeElement;
    imgDataPersonasdataDreamer.addEventListener('load', (event: { currentTarget: ImageBitmap; }) => {
      this.imgDataPersonasdataDreamerBase64 = this.getDataUrl(event.currentTarget);
    });
    const imgDataPersonasdataDoubter = this.imgDataPersonasdataDoubter.nativeElement;
    imgDataPersonasdataDoubter.addEventListener('load', (event: { currentTarget: ImageBitmap; }) => {
      this.imgDataPersonasdataDoubterBase64 = this.getDataUrl(event.currentTarget);
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
      content: this.content,
      footer: this.footer,
      styles: {
        tableOne: {
          margin: [40, 20, 40, 15]
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
        quote: {
          italics: true
        },
        small: {
          fontSize: 8,
          color: '#8c8c8c'
        },
        tableRow: {
          margin: [0, 15, 0, 15]
        },
        tableRowCol: {
          margin: [0, 0, 0, 0]
        },
        tableCard: {
          margin: [0, 5, 0, 0]
        },
        tableData: {
          margin: [0, 5, 0, 0]
        },
        tableLabel: {
          color: '#5a5a5a',
          bold: true,
          fontSize: 9
        },
        tableValue: {
          color: '#5a5a5a',
          bold: false,
          fontSize: 9
        },
        cardValue: {
          color: '#02779b',
          bold: true,
          fontSize: 14
        },
        cardLabel: {
          color: '#5a5a5a',
          bold: false,
          fontSize: 10
        },
        rowDataLabel: {
          color: '#5a5a5a',
          bold: true,
          fontSize: 8
        },
        rowDataValue: {
          color: '#5a5a5a',
          bold: false,
          fontSize: 8
        },
        rowDataValueHeaderWh: {
          color: '#fff',
          bold: true,
          fontSize: 12
        },
        rowDataValueWh: {
          color: '#fff',
          bold: false,
          fontSize: 20
        },
        rowDataValueContentWh: {
          color: '#fff',
          bold: true,
          fontSize: 8
        },
      }
    };
    var pdf = pdfMake.createPdf(docDefinition);
    var pdfName = 'Databits - ' + this.processSelected.name + '-' + moment(new Date()).format(FORMAT_DATE_PDF) + '.pdf';
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
    return [ // title
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
      this.lineResumeInfo,
      { // cards
        style: 'tableRow',
        table: {
          widths: ['*'],
          body: [
            [{
              table: {
                widths: [257, 257],
                body: [
                  [
                    this.cardA1,
                    {
                      style: 'tableRowCol',
                      table: {
                        widths: [257],
                        body: [
                          [
                            {
                              text: 'Participantes',
                              style: 'cardValue',
                              alignment: 'center'
                            }
                          ],
                          [
                            {
                              image: this.reportTeamService.canvasParticipants,
                              margin: [0, 10, 0, 0],
                              alignment: 'center',
                              width: 257 // half
                            }
                          ]
                        ]
                      },
                      layout: 'noBorders'
                    }
                  ]
                ]
              },
              layout: 'noBorders'
            },
            ],
          ]
        },
        layout: 'noBorders'
      }, {
        unbreakable: true,
        table: {
          style: 'tableRow',
          widths: ['*'],
          body: [
            [
              {
                text: 'Puntaje promedio por evaluación',
                style: 'cardValue',
                alignment: 'center'
              }
            ], [
              {
                image: this.reportTeamService.canvasAvgScore,
                margin: [0, 23, 0, 0],
                alignment: 'center',
                width: 514 // half
              }
            ]
          ]
        },
        layout: 'noBorders'
      }, {
        unbreakable: true,
        table: {
          style: 'tableRow',
          widths: ['*'],
          body: [
            [
              {
                text: 'Tiempo promedio por evaluación',
                style: 'cardValue',
                alignment: 'center'
              }
            ], [
              {
                image: this.reportTeamService.canvasAvgTime,
                margin: [0, 23, 0, 0],
                alignment: 'center',
                width: 514 // half
              }
            ]
          ]
        },
        layout: 'noBorders'
      }, {
        unbreakable: true,
        layout: 'noBorders',
        table: {
          style: 'tableRow',
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
                image: this.reportTeamService.canvasScoreTime,
                margin: [0, 0, 0, 0],
                alignment: 'center',
                width: 514 // half
              }
            ]
          ]
        }
      }, {
        style: 'tableRow',
        unbreakable: true,
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: 'Top Participantes',
                style: 'cardValue',
                alignment: 'center'
              }
            ],
            [
              this.getTopParicipantsTable(this.topParticipantsTable)
            ]
          ]
        },
        layout: 'noBorders'
      }, {
        table: {
          style: 'tableRow',
          widths: ['*'],
          body: [
            [
              {
                text: 'Conteo por tipo de Respuestas',
                style: 'cardValue',
                alignment: 'center',
                margin: [0, 20, 0, 0],
              }
            ], [this.getAnswerTypeTable(this.answerTypesTable)]
          ]
        },
        layout: 'noBorders'
      }, {
        unbreakable: true,
        table: {
          style: 'tableRow',
          widths: ['*'],
          body: [
            [
              {
                text: 'Cultura Analítica: Análisis Data Personas',
                style: 'cardValue',
                alignment: 'center',
                margin: [0, 20, 0, 0],
              }
            ], [
              this.getDataPersonasTable
            ]
          ]
        },
        layout: 'noBorders'
      }
    ];
  }
  get lineResumeInfo() {
    return { // info
      table: {
        widths: ['*', '*', '*'],
        body: [
          [
            {
              table: {
                widths: [25, '*'],
                body: [
                  [{ text: 'Inicio:', style: 'tableLabel', alignment: 'left', margin: [0, 9, 0, 8] }, { text: moment(this.processSelected.validFrom).format(FORMAT_DATE_PDF) + '\n' + moment(this.processSelected.validFrom).format(FORMAT_TIME_PDF), style: 'tableValue', alignment: 'left', margin: [3, 4, 3, 4] }]
                ]
              },
              layout: 'noBorders'
            },
            {
              table: {
                widths: [25, '*'],
                body: [
                  [{ text: 'Fin:', style: 'tableLabel', alignment: 'left', margin: [0, 9, 0, 8] }, { text: moment(this.processSelected.validUntil).format(FORMAT_DATE_PDF) + '\n' + moment(this.processSelected.validUntil).format(FORMAT_TIME_PDF), style: 'tableValue', alignment: 'left', margin: [3, 4, 3, 4] }],
                ]
              },
              layout: 'noBorders'
            },
            {
              table: {
                widths: [35, '*'],
                body: [
                  [{ text: 'Estado:', style: 'tableLabel', alignment: 'left', margin: [0, 8, 0, 8] }, { text: this.getProcessStateLabel(this.processSelected.status), style: 'tableValue', alignment: 'left', margin: [3, 8, 0, 8] }],
                ]
              },
              layout: 'noBorders'
            }
          ]
        ]
      },
      layout: 'noBorders'
    };
  }
  get cardA1() {
    return {
      table: {
        widths: [128, 128],
        body: [
          [
            this.getCardValue('Evaluaciones\nseleccionadas', this.processInfo.noEvaluations, [3, 3, 0, 3], [3, 3, 0, 3]),
            this.getCardValue('Participantes', this.processInfo.noRequests, [3, 3, 0, 3], [3, 9, 0, 9])
          ],
          [
            this.getCardValue('Puntaje\npromedio', this.pipePercent.transform(this.processInfo.avgScore, '0.0-2'), [3, 3, 0, 3], [3, 3, 0, 3]),
            this.getCardValue('Tiempo\npromedio', this.timePerformed, [3, 3, 0, 3], [3, 3, 0, 3])
          ]
        ]
      },
      layout: 'noBorders'
    };
  }
  getCardValue(label: string, value: any, marginValue: number[], marginLabel: number[]) {
    return {
      style: 'tableCard',
      table: {
        widths: ['*'],
        body: [
          [{ text: value, style: 'cardValue', alignment: 'center', margin: marginValue }],
          [{ text: label, style: 'cardLabel', alignment: 'center', margin: marginLabel }],
        ]
      },
      layout: {
        hLineColor: (i: any, node: any) => {
          return '#f1f1f1';
        },
        vLineColor: (i: any, node: any) => {
          return '#f1f1f1';
        }
      }
    };
  }
  getTopParicipantsTable(list: any[]): any {
    const body: any[] = [
      [
        { text: 'No.', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] }, { text: 'Participante', style: 'cardLabel', alignment: 'left', margin: [3, 3, 0, 3] }, { text: 'Puntaje', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] }
      ]
    ];
    list.forEach((item: any, idx: number) => {
      body.push([
        { text: idx + 1, style: 'rowDataLabel', alignment: 'center' }, { text: item.name, style: 'rowDataLabel' }, { text: this.pipePercent.transform(item.value, '0.0-2'), style: 'rowDataValue', alignment: 'center' }
      ]);
    });
    return {
      style: 'tableData',
      table: {
        headerRows: 1,
        widths: [50, '*', '*'],
        body
      },
      layout: 'lightHorizontalLines'
    };
  }
  getAnswerTypeTable(list: any[]) {
    const body: any[] = [
      [
        { text: 'No.', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
        { text: 'Evaluación', style: 'cardLabel', alignment: 'left', margin: [3, 3, 0, 3] },
        { text: 'Correctas', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
        { text: 'Incorrectas', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
        { text: 'No conozco la respuesta', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] },
        { text: 'Sin contestar', style: 'cardLabel', alignment: 'center', margin: [3, 3, 0, 3] }
      ]
    ];
    list.forEach((item: any, idx: number) => {
      body.push([
        { text: idx + 1, style: 'rowDataLabel', alignment: 'center' },
        { text: item.label, style: 'rowDataLabel' },
        { text: item.correct.toFixed(0), style: 'rowDataValue', alignment: 'center' },
        { text: item.incorrect.toFixed(0), style: 'rowDataValue', alignment: 'center' },
        { text: item.unknown.toFixed(0), style: 'rowDataValue', alignment: 'center' },
        { text: item.empty.toFixed(0), style: 'rowDataValue', alignment: 'center' }
      ]);
    });
    return {
      style: 'tableData',
      table: {
        headerRows: 1,
        widths: [50, '*', '*', '*', '*', '*'],
        body
      },
      layout: 'lightHorizontalLines'
    };
  }
  get getDataPersonasTable() {

    return {
      style: 'tableData',
      table: {
        widths: ['*', '*'],
        body: [
          [
            {
							border: [false, false, false, false],
							fillColor: '#02779b',
              layout: 'noBorders',
							table: {
                widths: ['*', '*'],
                body: [
                  [{
                    rowSpan: 3, 
                    image: this.imgDataPersonasdataChampionBase64,
                    width: 120,
                    alignment: 'center'
                  }, {text: this.archetypes[0].label, style: 'rowDataValueHeaderWh', alignment: 'center'}],
                  ['', {text: this.dataPersonasTable[0].valueInt, style: 'rowDataValueWh', alignment: 'center'}],
                  ['', {text: this.archetypes[0].metadata.description, style: 'rowDataValueContentWh', alignment: 'center', margin: [3, 3, 3, 3]}]
                ]
              }
						},
						{
							border: [false, false, false, false],
							fillColor: '#7665E0',
              layout: 'noBorders',
							table: {
                widths: ['*', '*'],
                body: [
                  [{
                    rowSpan: 3, 
                    image: this.imgDataPersonasdataKnightBase64,
                    width: 120,
                    alignment: 'center'
                  }, {text: this.archetypes[1].label, style: 'rowDataValueHeaderWh', alignment: 'center'}],
                  ['', {text: this.dataPersonasTable[1].valueInt, style: 'rowDataValueWh', alignment: 'center'}],
                  ['', {text: this.archetypes[1].metadata.description, style: 'rowDataValueContentWh', alignment: 'center', margin: [3, 3, 3, 3]}]
                ]
              }
						},
          ],
          [
            {
							border: [false, false, false, false],
							fillColor: '#bab2ef',
              layout: 'noBorders',
							table: {
                widths: ['*', '*'],
                body: [
                  [{
                    rowSpan: 3, 
                    image: this.imgDataPersonasdataDreamerBase64,
                    width: 120,
                    alignment: 'center'
                  }, {text: this.archetypes[2].label, style: 'rowDataValueHeaderWh', alignment: 'center'}],
                  ['', {text: this.dataPersonasTable[2].valueInt, style: 'rowDataValueWh', alignment: 'center'}],
                  ['', {text: this.archetypes[2].metadata.description, style: 'rowDataValueContentWh', alignment: 'center', margin: [3, 3, 3, 3]}]
                ]
              }
						},
            {
							border: [false, false, false, false],
							fillColor: '#4da0b9',
              layout: 'noBorders',
							table: {
                widths: ['*', '*'],
                body: [
                  [{
                    rowSpan: 3, 
                    image: this.imgDataPersonasdataDoubterBase64,
                    width: 120,
                    alignment: 'center'
                  }, {text: this.archetypes[3].label, style: 'rowDataValueHeaderWh', alignment: 'center'}],
                  ['', {text: this.dataPersonasTable[3].valueInt, style: 'rowDataValueWh', alignment: 'center'}],
                  ['', {text: this.archetypes[3].metadata.description, style: 'rowDataValueContentWh', alignment: 'center', margin: [3, 3, 3, 3]}]
                ]
              }
						}
          ]
        ]
      },
      layout: 'noBorders'
    };
  }
  getProcessTypeLabel(code: number) {
    return this.types.find(i => i.code === code)?.label ?? 'NE';
  }
  getProcessStateLabel(code: number) {
    return this.states.find(i => i.code === code)?.label ?? 'default';
  }
  get timePerformed() {
    return this.pipeSecondsFormat.transform(this.processInfo.avgTimePerformed);
  }

}
// ------------ DATA PERSONAS ----------------
@Component({
  selector: 'app-report-team-data-personas-table',
  templateUrl: './report-team-data-personas-table.component.html',
  styleUrls: ['./report-team.component.scss']
})
export class ReportTeamDataPersonasComponent implements OnInit, OnChanges, AfterViewInit {

  @Input() idProcess!: number;
  @Input() archetypes: Catalog[] = [];

  data: any[] = [];

  ngAfterViewInit(): void {
  }
  ngOnChanges(changes: SimpleChanges): void {
    for (const propName in changes) {
      const changedProp = changes[propName];
      const to: any = changedProp.currentValue;
      if (!changedProp.isFirstChange()) {
        if (propName === 'idProcess') {
          this.loadChart(this.idProcess, [], []);
        }
      }
    }
  }
  constructor(private _reportApi: ReportApiService) {}
  ngOnInit(): void {
    this.loadChart(this.idProcess, [], []);
  }
  loadChart(idProcess: number, evaluations: number[], participants: number[]) {
    const getDataPersonasData$ = this._reportApi.fetchDataPersonasTeamTable({ idProcess, evaluations, participants });
    getDataPersonasData$.subscribe((resp: ResponseApi) => {
      this.data = resp.result;
    });
  }
  getArchetypeLabelByValue(value: string) {
    const archetype = this.archetypes.find(i => i.value === value);
    return archetype !== undefined ? archetype.label : '';
  }
  getArchetypeDescriptionByValue(value: string) {
    const archetype = this.archetypes.find(i => i.value === value);
    return archetype !== undefined ? archetype.metadata.description : '';
  }
  
}