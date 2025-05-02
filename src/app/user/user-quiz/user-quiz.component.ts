import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { Quiz } from 'src/app/_models/AGQuiz';
import { QuizConfig } from 'src/app/_models/AGQuizConfig';
import { Question } from 'src/app/_models/AGQuizQuestion';
import { Option } from 'src/app/_models/AGQuizOption';
import { QuizService } from '../services/quiz.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { CATALOG_PROCESS_STATE, CATALOG_QUESTION_TYPE, CATALOG_QUESTION_TYPE_VALUE_UNIQUE, PROCESS_STATE_FINISHED, PROCESS_STATE_NEW, PROCESS_STATE_RUNNING, PROCESS_USER_SELECTED_EVALUATION, PROCESS_USER_SELECTED_ROUTE, STORAGE_LOCAL } from 'src/app/_utils/constants';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { mergeMap, tap } from 'rxjs/operators';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { iif, of, throwError, zip } from 'rxjs';
import { Catalog } from 'src/app/_models/Catalog';
import { NgxSpinnerService } from 'ngx-spinner';
import { UserProcessApiService } from 'src/app/_services/api/user-process-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { UserEvaluation } from 'src/app/_models/UserEvaluation';
import { QuestionApiService } from 'src/app/_services/api/question-api.service';
import * as _ from 'underscore';
import { ServerDataApiService } from 'src/app/_services/api/server-data-api.service';
import * as moment from 'moment';

interface ProcessSelcted {
  id: number;
  idUserProcess: number;
  name: string;
  account: any;
}
interface SelectedEmited {
  question: Question;
  option: Option;
}
interface EvaluationResults {
  answers: any[];
  questions: any[];
}

/**MAIN*/
@Component({
  selector: 'app-user-quiz',
  templateUrl: './user-quiz.component.html',
  styleUrls: ['./user-quiz.component.scss']
})
export class UserQuizComponent implements OnInit, OnDestroy {

  items: MenuItem[] = [];
  process: ProcessSelcted = Object.create({});
  evaluation: any = Object.create({});
  // quiz
  quiz: Quiz = new Quiz(null);
  mode = 'wait';
  config: QuizConfig = {
    'allowBack': true,
    'allowReview': true,
    'autoMove': false,  // if true, it will move to next question automatically when answered.
    'duration': 360,  // indicates the time (in secs) in which quiz needs to be completed. 0 means unlimited.
    'pageSize': 1,
    'requiredAll': false,  // indicates if you must answer all the questions before submitting.
    'richText': false,
    'shuffleQuestions': false,
    'shuffleOptions': false,
    'showClock': false,
    'showPager': true,
    'theme': 'none'
  };
  pager = {
    index: 0,
    size: 1,
    count: 1
  };
  timer: any = null;
  startTime!: Date;
  endTime!: Date;
  ellapsedTime = '00:00';
  duration = '';
  currentState = '';
  endAtInterval: any = null;

  //catalogs
  questionTypes: Catalog[] = [];
  questionStates: Catalog[] = [];

  constructor(private _storage: StorageService,
    private readonly _catalogAPi: CatalogApiService,
    private spinner: NgxSpinnerService,
    private readonly _userProcessApi: UserProcessApiService,
    private toast: CustomToastService,
    private readonly _questionApi: QuestionApiService,
    private confirmationService: ConfirmationService,
    private readonly _serverDataApi: ServerDataApiService) {
    this.process = this._storage.getObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_ROUTE);
    this.evaluation = this._storage.getObject(STORAGE_LOCAL, PROCESS_USER_SELECTED_EVALUATION);
  }
  ngOnDestroy(): void {
    this.clearIntervals();
  }
  ngOnInit(): void {
    this.clearIntervals();
    this.spinner.show("load");
    const initializeEvaluation$ = this._userProcessApi.initializeEvaluationById(this.evaluation.idMemberEvaluation)
      .pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp))),
        tap((resp: UserEvaluation) => {
          this.currentState = this.getStateValue(resp.status);
        })
      );
    const getQuestionsByEvaluation$ = this._questionApi.findByEvaluationId(this.evaluation.id).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
    );
    const getServerInfo$ = this._serverDataApi.fecthCurrentDatetime().pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
    );

    this.loadCatalogs().pipe(
      tap((resp: any[]) => {
        this.questionTypes = resp[0];
        this.questionStates = resp[1];
      }),
      mergeMap((resp: any) => getQuestionsByEvaluation$),
      tap((resp: any) => {
        this.evaluation.questions = resp;
      }),
      mergeMap((resp: any) => this._serverDataApi.fecthCurrentDatetime()),
      tap((resp: ResponseApi) => {
        this.endTime = new Date();
        if (resp.status === 'OK') {
          this.endTime = new Date(resp.result);
        }
      }),
      mergeMap((resp: any) => this._userProcessApi.findEvaluationById(this.evaluation.idMemberEvaluation)),
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp))),
      tap((resp: UserEvaluation) => {
        this.currentState = this.getStateValue(resp.status);
      }),
      mergeMap((resp: UserEvaluation) => iif(() => this.currentState === PROCESS_STATE_NEW, zip(initializeEvaluation$, getServerInfo$), zip(of(resp), getServerInfo$)))
    )
      .subscribe((resp: [UserEvaluation, any]) => {
        // timer
        this.startTime = new Date(resp[0].startAt);
        this.endTime = new Date();
        if (resp[1] !== undefined || resp[1] !== null) {
          this.endTime = new Date(resp[1]);
        }
        this.endAtInterval = setInterval(() => {
          var nowServer = moment(this.endTime).add(1, 'seconds');
          this.endTime = nowServer.toDate();
        }, 1000);
        // config
        this.spinner.hide("load");
        this.config.duration = this.sumAproximateTime(this.evaluation.questions ? this.evaluation.questions : []);
        if (this.currentState !== PROCESS_STATE_FINISHED) {
          this.loadQuiz();
        } else {
          this.mode = 'result';
          this.loadResult(resp[0].endAt);
        }
      }, err => {
        console.log(err);
        this.spinner.hide("load");
      });
  }
  loadCatalogs() {
    const getQuestionTypes$ = this._catalogAPi.findAllByType(CATALOG_QUESTION_TYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const getQuestionStates$ = this._catalogAPi.findAllByType(CATALOG_PROCESS_STATE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getQuestionTypes$, getQuestionStates$);
  }
  clearIntervals() {
    if(this.endAtInterval !== null) {
      clearInterval(this.endAtInterval);
      this.endAtInterval = null;
    }
  }
  loadQuiz() {
    this.quiz = new Quiz(this.evaluation);
    this.mode = this.getMode(this.currentState);
    this.pager.count = this.quiz.questions.length;
    this.ellapsedTime = '00:00';
    this.timer = setInterval(() => { this.tick(); }, 1000);
    this.duration = this.parseTime(this.config.duration);
  }
  loadResult(endAt: string) {
    this.quiz = new Quiz(this.evaluation);
    this.mode = this.getMode(this.currentState);
    this.pager.count = this.quiz.questions.length;
    this.ellapsedTime = this.getEllapsedTme(endAt);
    this.duration = this.parseTime(this.config.duration);
  }
  tick() {
    const now = this.endTime;
    const diff = (now.getTime() - this.startTime.getTime()) / 1000;
    if (diff >= this.config.duration) {
      this.onSubmit();
    }
    this.ellapsedTime = this.parseTime(diff);
  }
  getEllapsedTme(end: string) {
    const now = new Date(end);
    const diff = (now.getTime() - this.startTime.getTime()) / 1000;
    return this.parseTime(diff);
  }
  getMode(state: string) {
    if (state === PROCESS_STATE_RUNNING) {
      return 'quiz';
    }
    if (state === PROCESS_STATE_FINISHED) {
      return 'result';
    }
    return 'wait';
  }
  parseTime(totalSeconds: number) {
    let mins: string | number = Math.floor(totalSeconds / 60);
    let secs: string | number = Math.round(totalSeconds % 60);
    mins = (mins < 10 ? '0' : '') + mins;
    secs = (secs < 10 ? '0' : '') + secs;
    return `${mins}:${secs}`;
  }
  get filteredQuestions() {
    return (this.quiz.questions) ?
      this.quiz.questions.slice(this.pager.index, this.pager.index + this.pager.size) : [];
  }

  onSelectEmited(event: SelectedEmited) {
    const valueType = this.questionTypes.find(i => i.code === event.question.typeQuestion)?.value;
    if (valueType === CATALOG_QUESTION_TYPE_VALUE_UNIQUE) {
      event.question.answers.forEach((x) => { if (x.id !== event.option.id) x.selected = false; });
    }

    if (this.config.autoMove) {
      this.goTo(this.pager.index + 1);
    }
  }

  goTo(index: number) {
    if (index >= 0 && index < this.pager.count) {
      this.pager.index = index;
      this.mode = 'quiz';
    }
  }

  onSubmit() {
    const emptyAnswers: any = [];
    this.quiz.questions.forEach(q => {
      if (q.answers.every(a => a.selected === false)) {
        const questionEmptyItem: any = {
          idMemberEvaluation: this.evaluation.idMemberEvaluation,
          codeQuestion: q.code,
          version: q.version
        };
        emptyAnswers.push(questionEmptyItem);
      }
    });
    clearInterval(this.timer);
    this.spinner.show("load");
    this._userProcessApi.finishEvaluationById({id: this.evaluation.idMemberEvaluation, emptyAnswers})
      .pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp))),
        tap((resp: UserEvaluation) => {
          this.currentState = this.getStateValue(resp.status);
        })
      ).subscribe((resp: UserEvaluation) => {
        this.spinner.hide("load");
        let answers: any[] = [];
        this.quiz.questions.forEach(x => {
          const answeredList = x.answers.filter(a => a.selected).map(a => a.id);
          answers.push({ 'idEvaluation': this.quiz.id, 'idQuestion': x.id, 'answered': answeredList })
        });
        this.mode = 'result';
      }, err => {
        console.log(err);
        this.mode = 'result';
        this.toast.addPrimeToast('info', '', err.error.message ?? 'error');
        this.spinner.hide("load");
      });
  }

  sumAproximateTime(questions: any[]) {
    const seconds = questions.length > 0 ? questions.map((i: any) => i.aproximateTime).reduce((acc, item) => acc + item) : 600;
    return seconds;
  }
  getStateValue(code: number) {
    return this.questionStates.find(i => i.code === code)?.value ?? 'ND';
  }

  get companyName() {
    return this.process.account.company.name ?? '- -';
  }

  confirmSubmit() {
    this.confirmationService.confirm({
      message: '¿Quieres finalizar la evaluación?',
      header: 'Finalizar evaluación',
      icon: 'pi pi-check-circle',
      accept: () => {
       this.onSubmit();
      }
    });
  }

}

/**QUESTION*/
@Component({
  selector: 'app-user-quiz-question',
  templateUrl: './user-quiz-question.component.html',
  styleUrls: ['./user-quiz.component.scss']
})
export class UserQuizQuestionComponent implements OnInit {
  @Input() pager : any = {
    index: 0,
    size: 1,
    count: 1
  };
  @Input() question: Question = Object.create(null);
  @Input() idMemberEvaluation: number = Object.create(null);
  @Output() onSelected = new EventEmitter<SelectedEmited>();
  constructor(private _userProcessApi: UserProcessApiService) {}
  ngOnInit(){

    // shuffle answers
    this.question.answers = _.shuffle(this.question.answers);
    // push unknown answer to end
    if (this.question.answers.length> 0) {
      const answerUnknownIndex: number = this.question.answers
      .findIndex(i => i.content === 'No conozco la respuesta' || i.content === 'I dont know the answer');
      if (answerUnknownIndex >= 0) {
        const aux: any = {
          ...this.question.answers[answerUnknownIndex]
        };
        this.question.answers.splice(answerUnknownIndex, 1);
        this.question.answers.push(aux);
      }
    }

    const request: any = {
      idMemberEvaluation: this.idMemberEvaluation,
      codeQuestion: this.question.code,
      version: this.question.version
    };
    
    this._userProcessApi.findQuestionAnswer(request).subscribe((resp: ResponseApi) => {
      if (resp.result.orderSelected !== undefined) {
        this.question.answers = this.question.answers.map(i => {
          if (resp.result.orderSelected === i.orderAnswer) {
            i.selected = true;
          }
          return i;
        });
      }
    }, err => {
      console.log(err);
    });
  }
  onSelect(question: Question, option: Option)  {
    const request: any = {
      idMemberEvaluation: this.idMemberEvaluation,
      codeQuestion: this.question.code,
      version: this.question.version,
      orderSelected: option.orderAnswer,
      selected: option.selected
    };
    if (option.selected) {
      this._userProcessApi.saveAnswer(request)
      .subscribe((resp: ResponseApi) => {
        /*this.onSelected.emit(
          {
            question, option
          }
        );*/
      });
      setTimeout(() => {
        this.onSelected.emit(
          {
            question, option
          }
        );
      }, 200);
      
    } else {
      this._userProcessApi.deleteAnswer(request)
      .subscribe((resp: ResponseApi) => {
        /*this.onSelected.emit(
          {
            question, option
          }
        );*/
      });
      setTimeout(() => {
        this.onSelected.emit(
          {
            question, option
          }
        );
      }, 250);
    }
  }
}
/**REVIEW*/
@Component({
  selector: 'app-user-quiz-review',
  templateUrl: './user-quiz-review.component.html',
  styleUrls: ['./user-quiz.component.scss']
})
export class UserQuizReviewComponent implements OnInit {
  @Input() pager : any = {
    index: 0,
    size: 1,
    count: 1
  };
  @Input() question: Question = Object.create(null);
  @Input() idMemberEvaluation: number = Object.create(null);
  @Input() index: number = Object.create(null);

  @Output() onSelected = new EventEmitter<number>();

  isAnswered = false;
  loading = false;
  
  constructor(private _userProcessApi: UserProcessApiService) {}

  ngOnInit(): void {
    const request: any = {
      idMemberEvaluation: this.idMemberEvaluation,
      codeQuestion: this.question.code,
      version: this.question.version
    };
    this.loading = true;
    this._userProcessApi.findQuestionAnswer(request).subscribe((resp: ResponseApi) => {
      if (resp.result.orderSelected !== undefined) {
        this.question.answers = this.question.answers.map(i => {
          if (resp.result.orderSelected === i.orderAnswer) {
            this.isAnswered = true;
          }
          return i;
        });
      }
      this.loading = false;
    }, err => {
      console.log(err);
      this.loading = false;
    });
  }

  goTo(index: number) {
    this.onSelected.emit(index);
  }
  
}
/**RESULTS*/
@Component({
  selector: 'app-user-quiz-results',
  templateUrl: './user-quiz-results.component.html',
  styleUrls: ['./user-quiz.component.scss']
})
export class UserQuizResultsComponent implements OnInit {

  @Input() idMemberEvaluation: number = Object.create(null);
  results!: EvaluationResults;
  questions: any[] = [];
  answers: any[] = [];

  constructor(private _userProcessApi: UserProcessApiService) {}

  ngOnInit(): void {
    this._userProcessApi.fetchMemberEvaluationResultsById(this.idMemberEvaluation)
    .subscribe((resp: ResponseApi) => {
      let results: EvaluationResults = resp.result;
      if (results.questions !== undefined && results.questions.length > 0) {
        this.questions = results.questions;
      }
      if (results.answers !== undefined && results.answers.length > 0) {
        this.answers = results.answers;
      }
      if (this.questions.length === this.answers.length) {
        this.questions.forEach((question: any, i: number) => {
          if (question.answers !== undefined && question.answers.length > 0) {
            let answers: any[] = question.answers;
            if (answers !== undefined && answers.length > 0) {
              answers = answers.map(answer => {
                answer.selected = false;
                const answerStored: any = this.answers.find(a => a.codeQuestion === question.code && a.version === question.version);
                if (answerStored !== undefined &&  answer.orderAnswer === answerStored.orderSelected) {
                  answer.selected = true;
                }
                return answer;
              });
              this.questions[i].answers = answers;
            }
          }
        });
      }
    });
  }
  isCorrect(question: Question) {
    return question.answers.every(x => x.selected === x.isValid) ? true : false;
  };

}
/**SCORE*/
@Component({
  selector: 'app-user-quiz-score',
  templateUrl: './user-quiz-score.component.html',
  styleUrls: ['./user-quiz.component.scss']
})
export class UserQuizScoreComponent implements OnInit {
  @Input() idMemberEvaluation: number = Object.create(null);
  evaluation: UserEvaluation = Object.create(null);
  constructor(private _userProcessApi: UserProcessApiService) {}
  ngOnInit(): void {
    this._userProcessApi.findEvaluationById(this.idMemberEvaluation)
    .subscribe((resp: ResponseApi) => {
      this.evaluation = resp.result;
    });
  }

}
