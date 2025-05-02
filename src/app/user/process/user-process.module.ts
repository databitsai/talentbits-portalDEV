import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserProcessListComponent } from './user-process-list/user-process-list.component';
import { RouterModule } from '@angular/router';
import { UserProcessRoutes } from './user-process.routing';
import { PrimengCustomModule } from 'src/app/_primeng/primeng-custom.module';
import { MaterialCustomModule } from 'src/app/_material/material-custom.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { UserProcessEvaluationActionsComponent, UserProcessEvaluationsComponent } from './user-process-evaluations/user-process-evaluations.component';
import { UserEvaluationIntroductionComponent } from './user-evaluation-introduction/user-evaluation-introduction.component';
import { SharedAppModule } from 'src/app/_shared/shared.module';



@NgModule({
  declarations: [
    UserProcessListComponent,
    UserProcessEvaluationsComponent,
    UserEvaluationIntroductionComponent,
    UserProcessEvaluationActionsComponent
  ],
  imports: [
    CommonModule,
    SharedAppModule,
    RouterModule.forChild(UserProcessRoutes),
    PrimengCustomModule,
    MaterialCustomModule,
    TranslateModule,
    ReactiveFormsModule,
    NgxSpinnerModule
  ]
})
export class UserProcessModule { }
