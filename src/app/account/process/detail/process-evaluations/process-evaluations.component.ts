import { Component, OnInit } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { iif, merge, Observable, of, throwError, zip } from 'rxjs';
import { map, mergeMap, tap } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { Evaluation } from 'src/app/_models/Evaluation';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { EvaluationApiService } from 'src/app/_services/api/evaluation-api.service';
import { ProcessApiService } from 'src/app/_services/api/process-api.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { CATALOG_EVALUATIONS, CATALOG_EVALUATION_TYPES, PROCESS_SELECTED_ROUTE, STORAGE_LOCAL } from 'src/app/_utils/constants';

@Component({
  selector: 'app-process-evaluations',
  templateUrl: './process-evaluations.component.html',
  styleUrls: ['./process-evaluations.component.scss']
})
export class ProcessEvaluationsComponent implements OnInit {

  // varibales
  processSelected: ProcessApp = Object.create({});
  showReloadEvaluations = false;

  // catalogs
  evaluationsAvailables: Catalog[] = [];

  products: any[] = [
    {
      "id": "profile0",
      "title": "¿Qué hace un Data Scientist?",
      "image": "https://www.talentbits.ai/assets/img/others/01_data_scientist.jpg",
      "description": "Un científico de datos usa datos para identificar y resolver problemas de negocio complejos. Tiene un enfoque interdisciplinario, utilizando técnicas y conocimientos de diversas disciplinas científicas e informáticas.",
      "profile": "Data Scientist",
      "abilities": [
        "Exploración y visualización de datos",
        "Manipulación y limpieza de datos",
        "Procesos de ingeniería de variable",
        "Creación de modelos estadísticos"
      ]
    },
    {
      "id": "profile1",
      "title": "¿Qué hace un Data Engineer?",
      "image": "https://www.talentbits.ai/assets/img/others/02_data_engineer.jpg",
      "description": "Un ingeniero de datos prepara, refina y disponibiliza datasets de calidad y los integra en la arquitectura empresarial, creando flujos automatizados de datos que provienen de fuentes estructuradas y no estructuradas.",
      "profile": "Data Engineer",
      "abilities": [
        "Creación de pipelines ELT y ETL",
        "Conexión a distintas fuentes de datos",
        "Perfilamiento, imputación y corrección de errores",
        "Automatización y calendarización de jobs"
      ]
    },
    {
      "id": "profile2",
      "title": "¿Qué hace un Data Analyst?",
      "image": "https://www.talentbits.ai/assets/img/others/03_data_analyst.jpg",
      "description": "Un analista de datos recopila, organiza y estudia los datos para proporcionar soluciones desde una visión de negocio. Aplica herramientas de análisis y visualización de datos para la toma de decisiones y presentación de resultados.",
      "profile": "Data Analyst",
      "abilities": [
        "Capacidad de análisis y resolución de problemas",
        "Métodos estadísticos y análisis de datos",
        "Modelado, limpieza y enriquecimiento de datos",
        "Técnicas de visualización de datos"
      ]
    },
    {
      "id": "profile3",
      "title": "¿Qué hace un Data Quality Analyst?",
      "image": "https://www.talentbits.ai/assets/img/others/05_data_quality.jpg",
      "description": "Un analista de calidad de datos implementa procedimientos para garantizar la calidad, validación y vinculación de datos. Busca asegurar que los datos y el análisis sean los correctos aplicando técnicas de limpieza de acuerdo al contexto de negocio.",
      "profile": "Data Quality Analyst",
      "abilities": [
        "Perfilamiento de datos",
        "Limpieza de datos",
        "Dominio de métricas de calidad"
      ]
    },
    {
      "id": "profile4",
      "title": "¿Qué hace un Data Steward?",
      "image": "https://www.talentbits.ai/assets/img/others/04_data_steward.jpg",
      "description": "El custodio de datos se encarga de definir y manejar el uso de datos, ejecutando las políticas, criterios y procesos para asegurar la calidad, seguridad e integridad de los datos de la organización, de principio a fin. Además, mantiene las definiciones y formatos de datos acordados, identifica inconvenientes en la calidad de los datos y se asegura de que los usuarios de negocio se adhieran a los estándares definidos.",
      "profile": "Data Steward",
      "abilities": [
        "Mapeo de los datos entre los sistemas",
        "Gestión y control de los datos",
        "Métricas de calidad de datos"
      ]
    },
    {
      "id": "profile5",
      "title": "¿Qué es la Cultura Analítica?",
      "image": "https://www.talentbits.ai/assets/img/others/06_area_cultura_anal%C3%ADtica%20.jpg",
      "description": "Una sólida cultura analítica conlleva el seguimiento de un conjunto específico de valores, comportamientos y normas que permiten una analítica de datos eficaz en donde, las personas son capaces de consumir, interpretar y comunicar datos. De esta manera, se fomenta el descubrimiento de hallazgos y se respaldan las decisiones con información para lograr objetivos estratégicos.",
      "profile": "Cultura Analítica",
      "type": 1,
      "abilities": [
        "Pensamiento analítico",
        "Alfabetización de datos",
        "Principios de visualización de datos"
      ]
    }
  ];
  evaluations: any[] =[];

  responsiveOptions!: any;
  profileSelected!: any;

  constructor(private readonly _evaluationsApi: EvaluationApiService,
    private readonly _catalogApi: CatalogApiService,
    private readonly _storage: StorageService,
    private readonly _processApi: ProcessApiService,
    private spinner: NgxSpinnerService) {
    this.responsiveOptions = [
      {
        breakpoint: '1024px',
        numVisible: 1,
        numScroll: 1
      },
      {
        breakpoint: '768px',
        numVisible: 1,
        numScroll: 1
      },
      {
        breakpoint: '560px',
        numVisible: 1,
        numScroll: 1
      }
    ];
    this.processSelected = this._storage.getObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
  }

  ngOnInit(): void {

    const getAllEvaluations$ = this._evaluationsApi.findAllEvaluation().pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message))),
      map((resp: Evaluation[]) => {
        const evaluations = resp.map(i => {
          const profiles: any[] = i.profiles ?? [];
          const profilesNames: string[] = profiles.map(i => i.name);
          const cataogItem: Catalog = this.evaluationsAvailables.find(item => item.code === i.id) ?? Object.create({});
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
        return evaluations;
      })
    );

    const getProcessEvaluations$ = this._processApi.findEvaluations(this.processSelected.id).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message))),
      
    );

    this.profileSelected = this.products[0];

    this.updateHighligthsProfile();
    
    this.spinner.show("load");
    this.loadCatalogs().pipe(
      tap((resp: any[]) => {
        this.evaluationsAvailables = resp[0];
      }),
      mergeMap((resp: any) => zip(getAllEvaluations$, getProcessEvaluations$))
    )
    .subscribe((responses: [any, Evaluation[]]) => {
      this.evaluations  = responses[0];
      this.evaluations = this.evaluations.map((evaluation: any) => {
        if (responses[1].map(i => i.id).includes(evaluation.id)) {
          evaluation.selected = true;
          evaluation.status = 'highlight';
        }
        return evaluation;
      });
      this.updateHighligthsProfile();
      this.spinner.hide("load");
    }, err => {
      console.log(err);
      this.spinner.hide("load");
    });
  }
  loadCatalogs(): Observable<any> {
    const getEvaluations$ = this._catalogApi.findAllByType(CATALOG_EVALUATIONS).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getEvaluations$);
  }
  onChipClick(item: any) {
    const request: any = {
      idProcess: this.processSelected.id,
      codeEvaluation: item.id
    };
    if (!item.selected) {
      item.selected = true;
      item.status = 'highlight';
      this._processApi.addEvaluation(request).subscribe((resp: ResponseApi) => {
        // item.selected = true;
        // item.status = 'highlight';
      }, err => {
        console.log(err);
      });
    } else {
      item.selected = false;
      item.status = 'no-highlight';
      this._processApi.removeEvaluation(request).subscribe((resp: ResponseApi) => {
        // item.selected = false;
        // item.status = 'no-highlight';
      }, err => {
        console.log(err);
      });
    }
    this.updateHighligthsProfile();
  }
  updateHighligthsProfile() {
    this.evaluations = this.evaluations.map(evaluation => {
      const profiles: string[] = evaluation.profile.split(',');
      if (profiles.includes(this.profileSelected.profile) || evaluation.selected) {
        evaluation.status = 'highlight';
      } else {
        evaluation.status = '';
      }
      return evaluation;
    });
  }
  onProfileChange(ev: any) {
    this.profileSelected = this.products[ev.page] ?? this.products[0];
    this.updateHighligthsProfile();
  }
  onShowReloadQuestions() {
    this.showReloadEvaluations = true;
  }
}
