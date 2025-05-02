import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimengCustomModule } from '../../_primeng/primeng-custom.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialCustomModule } from '../../_material/material-custom.module';
import { EvaluationListComponent } from './evaluation-list/evaluation-list.component';
import { EvaluationRoutes } from './evaluation.routing';
import { QuestionListComponent } from './question-list/question-list.component';
import { QuestionAnswerComponent } from './question-answer/question-answer.component';


@NgModule({
  declarations: [
    EvaluationListComponent,
    QuestionListComponent,
    QuestionAnswerComponent
  ],
  imports: [
    CommonModule,
    PrimengCustomModule,
    RouterModule.forChild(EvaluationRoutes),
    TranslateModule,
    ReactiveFormsModule,
    MaterialCustomModule


  ]
})
export class EvaluationModule { }


