import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserRoutes } from './user.routing';
import { UserQuizComponent, UserQuizQuestionComponent, UserQuizResultsComponent, UserQuizReviewComponent, UserQuizScoreComponent } from './user-quiz/user-quiz.component';
import { PrimengCustomModule } from '../_primeng/primeng-custom.module';
import { MaterialCustomModule } from '../_material/material-custom.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';



@NgModule({
  declarations: [
    UserQuizComponent,
    UserQuizQuestionComponent,
    UserQuizReviewComponent,
    UserQuizScoreComponent,
    UserQuizResultsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(UserRoutes),
    PrimengCustomModule,
    MaterialCustomModule,
    TranslateModule,
    ReactiveFormsModule,
    NgxSpinnerModule
  ]
})
export class UserModule { }
