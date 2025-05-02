import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimengCustomModule } from 'src/app/_primeng/primeng-custom.module';
import { MaterialCustomModule } from 'src/app/_material/material-custom.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { JobOpportunitiesComponent } from './job-opportunities/job-opportunities.component';
import { JobOpportunitiesRoutes } from './job-opportunities.routing';
import { JobSelectedComponent } from './job-selected/job-selected.component';



@NgModule({
  declarations: [
    JobOpportunitiesComponent,
    JobSelectedComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(JobOpportunitiesRoutes),
    PrimengCustomModule,
    MaterialCustomModule,
    TranslateModule,
    ReactiveFormsModule,
    NgxSpinnerModule
  ]
})
export class JobOpportunitinesModule { }
