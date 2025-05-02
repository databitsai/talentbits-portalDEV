import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { iif, Observable, of, range, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { Question } from 'src/app/_models/Question';
import { Profile } from 'src/app/_models/Profile';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { QuestionApiService } from 'src/app/_services/api/question-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import {
  CATALOG_ANSWER_TYPE,
  CATALOG_QUALIFICATION_ARCHETYPE,
  CATALOG_QUESTION_DIFFICULTY,
  CATALOG_QUESTION_TYPE,
  QUALIFICATION_ARCHETYPES_EVALUATION_CODES,
} from 'src/app/_utils/constants';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { IAnswer } from 'src/app/_models/Answer';

@Component({
  selector: 'app-question-answer',
  templateUrl: './question-answer.component.html',
})
export class QuestionAnswerComponent implements OnInit, OnDestroy {

  // catalogs
  difficultyLevel: Catalog[] = [];
  typeQuestion: Catalog[] = [];
  QueryAnswerList: Question[] = [];
  typeAnswers: Catalog[] = [];
  archetypes: Catalog[] = [];

  // forms
  checkQuestionAnswerForm!: FormGroup;

  // variables
  showEvaluation!: boolean;
  textoDemo!: string;
  idEvaluation!: number;
  idQuestion!: number;
  textContainer: string = '';
  itemDialog!: boolean;
  submitted: boolean = false;

  itemQuestionDialog!: boolean;
  items: Question[] = [];
  item!: Question;

  questionAnwers!: any[];

  listaAnswer: IAnswer[] = [];
                        
  profileSelected: any[] = [];
  profileList: Profile[] = [];

  fixAnswerLenght = 4;
  indexUnknownAnswer = -1;
  codeCustomAnswerCatalog = 1900;
  codeUnknownAnswerCatalog = 1901;

  constructor(
    private fb: FormBuilder,
    private toast: CustomToastService,
    private readonly _catalogAPi: CatalogApiService,
    private _questionApi: QuestionApiService,
    private _router: Router,
    private activeRoute: ActivatedRoute,
  ) {
    this.listaAnswer = [
      {content:'', isValid:false, orderAnswer:0, disabled: false},
      {content:'', isValid:false, orderAnswer:1, disabled: false},
      {content:'', isValid:false, orderAnswer:2, disabled: false},
      {content:'No conozco la respuesta', isValid:false, orderAnswer:3, disabled: true, type: this.codeCustomAnswerCatalog}
    ];
  }

  ngOnInit(): void {

    const evaluationAuxId = this.activeRoute.snapshot.paramMap.get('idEvaluation') ?? '-1';
    this.idEvaluation = parseInt(evaluationAuxId);
    
    const questionAuxId = this.activeRoute.snapshot.paramMap.get('idQuestion') ?? '-1';
    this.idQuestion = parseInt(questionAuxId);

    if (!isNaN(this.idQuestion) && !isNaN(this.idEvaluation) && this.idQuestion !== -1 && this.idEvaluation !== -1) {
      this.submitted = true;
    }

    this.checkQuestionAnswerForm = this.fb.group({
      title: ['', Validators.required],
      code: ['', Validators.required],
      score: ['1'],
      idTypeQuestion: ['', Validators.required],
      aproximateTime: ['60', Validators.required],
      idDifficulty: ['', Validators.required],
      content: ['', Validators.required],
      codeEvaluation:[this.idEvaluation],
      id:[this.idQuestion],
      answerList:[this.listaAnswer]
    });
    this.checkQuestionAnswerForm.get('score')?.disable();
    this.archetypeSetting();

    this.loadCatalogs()
    .pipe(
      tap((catalogs: any[]) => {
        this.difficultyLevel = catalogs[0];
        this.typeQuestion = catalogs[1];
        this.typeAnswers = catalogs[2];
        this.archetypes = catalogs[3].filter((i: Catalog) => i.metadata.code === this.idEvaluation);
      }),
      mergeMap((resp: any) => iif(() => this.idQuestion !== -1, this.loadQuestionAnswer(), of(null)) ),
      tap((questionAnswer: any) => {
        this.checkQuestionAnswerForm.get('idTypeQuestion')?.setValue(this.typeQuestion[0].code);
        if(questionAnswer !== null) {
          this.listaAnswer = questionAnswer.answers;
          this.checkQuestionAnswerForm.get('title')?.setValue(questionAnswer.title);
          this.checkQuestionAnswerForm.get('score')?.setValue(questionAnswer.score);
          this.checkQuestionAnswerForm.get('aproximateTime')?.setValue(questionAnswer.aproximateTime);
          this.checkQuestionAnswerForm.get('idDifficulty')?.setValue(questionAnswer.difficulty);
          this.checkQuestionAnswerForm.get('idTypeQuestion')?.setValue(questionAnswer.typeQuestion);
          this.checkQuestionAnswerForm.get('content')?.setValue(questionAnswer.content);
          this.checkQuestionAnswerForm.get('code')?.setValue(questionAnswer.code);
        }
      }),
    )
      .subscribe(
        (resp: any[]) => {
          this.completeIncompleteAnswers();
          this.addTypesCodes();
          this.disableNoCustomAnswers();
          this.replaceNoCustomLabels();
        },
        (err) => {
          console.log(err);
          this.toast.addPrimeToast('error', '', err.error.message);
        }
      );
  }
  archetypeSetting() {
    if (this.isQualificationArchetype) {
      
      this.listaAnswer = [
        {content:'', isValid:false, orderAnswer:0, disabled: false},
        {content:'', isValid:false, orderAnswer:1, disabled: false},
        {content:'', isValid:false, orderAnswer:2, disabled: false},
        {content:'', isValid:false, orderAnswer:3, disabled: false}
      ];
    }
  }

  loadCatalogs(): Observable<any> {
    const questionDificulCatalog$ = this._catalogAPi.findAllByType(CATALOG_QUESTION_DIFFICULTY).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const questionTypeCatalog$ = this._catalogAPi.findAllByType(CATALOG_QUESTION_TYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const answerTypeCatalog$ = this._catalogAPi.findAllByType(CATALOG_ANSWER_TYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const archetypeCatalog$ = this._catalogAPi.findAllByType(CATALOG_QUALIFICATION_ARCHETYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(questionDificulCatalog$, questionTypeCatalog$, answerTypeCatalog$, archetypeCatalog$);
  }

  loadQuestionAnswer(): Observable<any> {
    const questionAnswer$ = this._questionApi.findByIdQuestion(this.idQuestion).pipe(
        mergeMap((response: ResponseApi) =>iif(() => response.status === 'OK',of(response.result),throwError(response.message)))
      );
    return questionAnswer$;
  }

  // Table CRUD
  get isAnswersValid() {
    if (this.isQualificationArchetype) {
      // validate if types are archetypes
      const validation = this.listaAnswer.map(i => i.type ? i.type : -1).every(code => this.archetypes.map(i => i.code).includes(code));
      console.log(this.listaAnswer.map(i => i.type ? i.type : -1), validation);
      return validation;
    }
    // else validate if some is valid true
    return this.listaAnswer.map(i => i.isValid).some(i => i === true);
  };
  saveItem() {
    let listValid = true;

    for (let index = 0; index < this.listaAnswer.length; index++) {
      const element = this.listaAnswer[index];
      if (element.content === null || element.content === undefined || element.content === "") {
        listValid=false;
      }
    }

    if (
      this.checkQuestionAnswerForm.get('title')?.value == "" ||
      this.checkQuestionAnswerForm.get('score')?.value == "" ||
      this.checkQuestionAnswerForm.get('aproximateTime') ?.value == "" ||
      this.checkQuestionAnswerForm.get('idDifficulty')?.value == "" ||
      this.checkQuestionAnswerForm.get('idDifficulty')?.value == "" ||
      this.checkQuestionAnswerForm.get('idTypeQuestion')?.value == "" ||
      this.checkQuestionAnswerForm.get('content')?.value == "" ||
      listValid == false
    ){
        this.toast.addPrimeToast('error', '','Debe completar todos los campos antes de guardar la pregunta');
    }


    this.checkQuestionAnswerForm.get('answerList')?.setValue(this.listaAnswer);

    if (this.checkQuestionAnswerForm.valid && listValid && this.isAnswersValid) {
      this.checkQuestionAnswerForm.get('score')?.enable();
      this.saveItemOnDb(this.checkQuestionAnswerForm.value, this.submitted);
      // 
    } else {
      if (this.isQualificationArchetype && !this.isAnswersValid){
        this.toast.addPrimeToast('error', '','Debe completar todos los arquetipos antes de guardar la pregunta');
      }
      this.validateAllFormFields(this.checkQuestionAnswerForm);
    }
  }

  saveItemOnDb(item: any, submitted: boolean) {
    console.log(item);
    const save$ = this._questionApi.create(item);
    const update$ = this._questionApi.update(item);
    const request$ = !submitted ? save$ : update$;

    request$.subscribe(
      (resp: ResponseApi) => {
        this.item = resp.result;
        this.toast.addPrimeToast('success', '', resp.message);
        this.openPage('/admin/evaluations/list-question/');
        this.checkQuestionAnswerForm.get('score')?.disable();
      },
      (err) => {
        this.toast.addPrimeToast('error', '', err.error.message);
        this.checkQuestionAnswerForm.get('score')?.disable();
      },
      () => {}
    );
  }

  resetAllForms() {
    this.checkQuestionAnswerForm.reset();
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
  completeIncompleteAnswers() {
    const orders = range(0, this.fixAnswerLenght);
    orders.subscribe((order: number) => {
      const answerSearch = this.listaAnswer.find(answer => answer.orderAnswer === order);
      if (answerSearch === undefined) {
        const answerToComplete: IAnswer = {content:'', isValid:false, orderAnswer:order};
        this.listaAnswer.push(answerToComplete);
        this.listaAnswer.sort((a, b) => a.orderAnswer - b.orderAnswer);
      }
    });
  }
  addTypesCodes() {
    this.listaAnswer = this.listaAnswer.map(answer => {
      if ((answer.type === null || answer.type === undefined) && !this.isQualificationArchetype) {
        if (answer.orderAnswer === this.indexUnknownAnswer) {
          answer.type = this.codeUnknownAnswerCatalog;
          answer.disabled = true;
        } else {
          answer.type = this.codeCustomAnswerCatalog;
        }
      }
      return answer;
    });
  }
  disableNoCustomAnswers() {
    this.listaAnswer = this.listaAnswer.map(answer => {
      answer.disabled = false;
      if (answer.orderAnswer === this.indexUnknownAnswer && !this.isQualificationArchetype) {
        answer.disabled = true;
      }
      return answer;
    });
  }
  replaceNoCustomLabels() {
    this.listaAnswer = this.listaAnswer.map(answer => {
      if (answer.orderAnswer === this.indexUnknownAnswer && !this.isQualificationArchetype) {
        answer.content = this.typeAnswers.find(i => i.value === 'unknown')?.label ?? 'ND';
      }
      return answer;
    });
  }
  cleanAnswersPrevToSave(): any[] {
    return this.listaAnswer.map(answer => {
      delete answer.disabled;
      return answer;
    });
  }
  onChangeAnswerItem(item: IAnswer) {
    const auxList = this.listaAnswer.map(a => {
      if (a.id !== item.id) {
        a.isValid = false;
      }
      return a;
    });
    this.listaAnswer = [...auxList];
  }

  // destroy
  ngOnDestroy(): void {}

  openPage(pageUrl: string) {
    this._router.navigate([pageUrl,this.idEvaluation]);
  }

  get isQualificationArchetype() {
    return QUALIFICATION_ARCHETYPES_EVALUATION_CODES.includes(this.idEvaluation);
  }

}
