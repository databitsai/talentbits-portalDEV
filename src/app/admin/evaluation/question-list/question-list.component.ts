import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { Question } from 'src/app/_models/Question';
import { Profile } from 'src/app/_models/Profile';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { UserAccount } from 'src/app/_models/UserAccount';
import { QuestionApiService } from 'src/app/_services/api/question-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { CATALOG_QUESTION_DIFFICULTY, CATALOG_QUESTION_TYPE} from 'src/app/_utils/constants';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { EvaluationApiService } from 'src/app/_services/api/evaluation-api.service';

@Component({
  selector: 'app-question-list',
  templateUrl: './question-list.component.html',
  styles: [`
        .outofstock {
            font-weight: 700;
            color: #FF5252;
        }
        
        .lowstock {
            font-weight: 700;
            color: #FFA726;
        }
        
        .instock {
            font-weight: 700;
            color: #66BB6A;
        }
        
        :host ::ng-deep .row-accessories {
            background-color: rgba(0,0,0,.15) !important;
        }
    `
    ]
})
export class QuestionListComponent implements OnInit, OnDestroy {
  // table
  itemDialog!: boolean;
  submitted: boolean = false;

  itemQuestionDialog!: boolean;
  items: Question[] = [];
  item!: Question;
  evaluationName!: string;

  // catalogs
  difficultyLevel: Catalog[] = [];
  typeQuestion: Catalog[] = [];

  // forms
  checkEvaluationForm!: FormGroup;
  evaluationForm!: FormGroup;

  // variables
  profileSelected: any[] = [];
  profileList: Profile[] = [];
  singledropdownSettings = {};
  dropdownSettings = {};
  closeDropdownSelection = false;
  showEvaluation!: boolean;
  textoDemo!: string;
  idEvaluation!: number;

  constructor(
    private toast: CustomToastService,
    private confirmationService: ConfirmationService,
    private readonly _catalogQuestion: QuestionApiService,
    private readonly _catalogAPi: CatalogApiService,
    private _questionApi: QuestionApiService,
    private spinner: NgxSpinnerService,
    private activeRoute: ActivatedRoute,
    private _evaluationApi: EvaluationApiService
  ) {}

  ngOnInit(): void {
    let evaluationAuxId = this.activeRoute.snapshot.paramMap.get('idEvaluation') ?? '-1';
    this.idEvaluation = parseInt(evaluationAuxId);

    this._evaluationApi.findById(this.idEvaluation)
    .subscribe((resp: ResponseApi) => {
      this.evaluationName = resp.result.name ?? 'NE';
    }, err => console.log(err));

    this.loadCatalogs().pipe(
      tap((catalogs: any[]) => {
        this.difficultyLevel = catalogs[0];
        this.typeQuestion = catalogs[1];
      }),
      mergeMap((resp: any) => this.loadQuestionCatalogs())
    )
      .subscribe(
        (list: Question[]) => {
          this.items = list;
        },
        (err) => {
          console.log(err);
          this.toast.addPrimeToast('error', '', err.error.message);
        }
      );

  }
  

  loadCatalogs(): Observable<any> {
    const questionDificulCatalog$ = this._catalogAPi.findAllByType(CATALOG_QUESTION_DIFFICULTY).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const questionTypeCatalog$ = this._catalogAPi.findAllByType(CATALOG_QUESTION_TYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(questionDificulCatalog$, questionTypeCatalog$);
  }

  loadQuestionCatalogs(): Observable<any> {
    const questionCatalog$ = this._catalogQuestion
      .findByEvaluationId(this.idEvaluation)
      .pipe(
        mergeMap((response: ResponseApi) =>
          iif(
            () => response.status === 'OK',
            of(response.result),
            throwError(response.message)
          )
        )
      );
    return questionCatalog$;
  }
  
  // Table CRUD
  deleteItem(item: any) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres eliminar la pregunta "' + item.code + '"?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show('load');
        this._questionApi
          .delete(item.id)
          .pipe(
            mergeMap((response: ResponseApi) =>
              iif(
                () => response.status === 'OK',
                of(response),
                throwError(response.message)
              )
            )
          )
          .subscribe(
            (resp: any) => {
              this.items = this.items.filter((val) => val.id !== item.id);
              this.item = Object.create({});
              this.toast.addPrimeToast('success', '', resp.message);
              this.spinner.hide('load');
            },
            (err) => {
              console.log(err);
              this.toast.addPrimeToast('error', '', err.error.message);
              this.spinner.hide('load');
            }
          );
      },
    });
  }

  // Screen controls
  openNewEvaluation() {
    this.item = Object.create({});
    // this.submitted = false;
    this.itemDialog = true;
  }

  onHideCreate(event: any) {
    this.itemDialog = false;
    // this.submitted = false;
    this.resetAllForms();
  }

  resetAllForms() {
    this.evaluationForm.reset();
  }

  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
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

  // For custom component
  goForward(stepper: MatStepper) {
    stepper.next();
  }

  onChangePostVacancy() {
    if (!this.evaluationForm.get('isPostVacancyActive')?.value) {
      this.evaluationForm.get('isHighlightVacancyActive')?.setValue(false);
    }
  }

  // destroy
  ngOnDestroy(): void {}

  // Selectors
  onSelectAll(items: any) {
    console.log(items);
  }

  onItemSelectProfile(item: any) {
    console.log(item);
  }

  getDifficultyLevel(code: number) {
    return this.difficultyLevel.find(i => i.code === code)?.label ?? 'NE';
  }

  getTypeEvaluation(code: number) {
    return this.typeQuestion.find(i => i.code === code)?.label ?? 'NE';
  }
}
