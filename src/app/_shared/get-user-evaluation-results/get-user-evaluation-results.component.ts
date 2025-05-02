import { Component, Input, OnInit } from '@angular/core';
import { Question } from 'src/app/_models/AGQuizQuestion';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { UserProcessApiService } from 'src/app/_services/api/user-process-api.service';

interface EvaluationResults {
  answers: any[];
  questions: any[];
}

@Component({
  selector: 'app-get-user-evaluation-results',
  templateUrl: './get-user-evaluation-results.component.html',
  styleUrls: ['./get-user-evaluation-results.component.scss']
})
export class GetUserEvaluationResultsComponent implements OnInit {

  @Input() idMemberEvaluation: number = Object.create(null);
  results!: EvaluationResults;
  questions: any[] = [];
  answers: any[] = [];
  loading = false;

  constructor(private _userProcessApi: UserProcessApiService) {}

  ngOnInit(): void {
    this.loading = true;
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
      this.loading = false;
    }, err => {
      this.loading = false;
    });
  }
  isCorrect(question: Question) {
    return question.answers.every(x => x.selected === x.isValid) ? true : false;
  };

}
