import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimengCustomModule } from 'src/app/_primeng/primeng-custom.module';
import { MaterialCustomModule } from 'src/app/_material/material-custom.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { VaccantListComponent } from './vaccant-list/vaccant-list.component';
import { VaccantRoutes } from './vaccant-routing.module';
import { VaccantDetailComponent } from './detail/vaccant-detail/vaccant-detail.component';
import { VaccantResumeComponent } from './detail/vaccant-resume/vaccant-resume.component';
import { VaccantStepComponent } from './detail/vaccant-steps.component';
import { ApplicantListComponent, ApplicantListProcessComponent } from './applicant-list/applicant-list.component';
import { SharedAppModule } from 'src/app/_shared/shared.module';


@NgModule({
  declarations: [
    VaccantListComponent,
    VaccantDetailComponent,
    VaccantResumeComponent,
    VaccantStepComponent,
    ApplicantListComponent,
    ApplicantListProcessComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(VaccantRoutes),
    PrimengCustomModule,
    MaterialCustomModule,
    TranslateModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    SharedAppModule
  ]
})
export class VaccantModule { }
