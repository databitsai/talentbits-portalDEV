import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessListComponent } from './process-list/process-list.component';
import { RouterModule } from '@angular/router';
import { AccountProcessRoutes } from './account-process-routing.module';
import { PrimengCustomModule } from 'src/app/_primeng/primeng-custom.module';
import { MaterialCustomModule } from 'src/app/_material/material-custom.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { ProcessStepsComponent } from './detail/process-steps.component';
import { ProcessInformationComponent } from './detail/process-information/process-information.component';
import { ProcessEvaluationsComponent } from './detail/process-evaluations/process-evaluations.component';
import { ProcessRequestsComponent, ProcessRequestsEvaluationsComponent } from './detail/process-requests/process-requests.component';
import { CardResumeEvaluationsComponent, CardResumeProcessComponent, CardResumeRequestsComponent, CardResumeVaccantComponent, ProcessResumeComponent } from './detail/process-resume/process-resume.component';
import { SharedAppModule } from 'src/app/_shared/shared.module';
import { ReportsComponent } from './reports/reports.component';
import { ReportTeamAnswersTypesComponent, ReportTeamAvgScoreAvgTimeComponent, ReportTeamAvgScoreComponent, ReportTeamAvgTimeComponent, ReportTeamBarchartParticipantsComponent, ReportTeamBtnDownloadPdfComponent, ReportTeamComponent, ReportTeamDataPersonasComponent, ReportTeamFiltersComponent, ReportTeamParticipantsTopComponent, ReportTeamResumeComponent, ReportTeamValueCardComponent } from './reports/report-team/report-team.component';
import { ChartModule } from 'primeng/chart';
import { ReportParticipantsAnswerTypesComponent, ReportParticipantsAvgScoreTimeComponent, ReportParticipantsBtnDownloadExcelComponent, ReportParticipantsBtnDownloadPdfComponent, ReportParticipantsComponent, ReportParticipantsDataPersonasComponent, ReportParticipantsFiltersComponent, ReportParticipantsScoreTableComponent } from './reports/report-participants/report-participants.component';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { CustomPaginator } from 'src/app/_utils/custom-paginator';
import { ProcessVaccantComponent, ProcessVaccantListComponent } from './detail/process-vaccant/process-vaccant.component';


@NgModule({
  declarations: [
    ProcessListComponent,
    ProcessStepsComponent,
    ProcessInformationComponent,
    ProcessEvaluationsComponent,
    ProcessRequestsComponent,
    ProcessResumeComponent,
    CardResumeProcessComponent,
    CardResumeEvaluationsComponent,
    CardResumeRequestsComponent,
    ProcessRequestsEvaluationsComponent,
    ReportsComponent,
    ReportTeamComponent,
    ReportTeamResumeComponent,
    ReportTeamValueCardComponent,
    ReportTeamBarchartParticipantsComponent,
    ReportTeamAvgScoreComponent,
    ReportTeamAvgTimeComponent,
    ReportTeamAnswersTypesComponent,
    ReportTeamFiltersComponent,
    ReportTeamAvgScoreAvgTimeComponent,
    ReportParticipantsComponent,
    ReportParticipantsScoreTableComponent,
    ReportParticipantsAvgScoreTimeComponent,
    ReportParticipantsAnswerTypesComponent,
    ReportParticipantsFiltersComponent,
    ReportTeamParticipantsTopComponent,
    ReportParticipantsBtnDownloadExcelComponent,
    ReportTeamBtnDownloadPdfComponent,
    ReportParticipantsBtnDownloadPdfComponent,
    ReportParticipantsDataPersonasComponent,
    ReportTeamDataPersonasComponent,
    ProcessVaccantComponent,
    ProcessVaccantListComponent,
    CardResumeVaccantComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(AccountProcessRoutes),
    PrimengCustomModule,
    MaterialCustomModule,
    TranslateModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    SharedAppModule,
    ChartModule
  ],
  providers: [
    { provide: MatPaginatorIntl, useValue: CustomPaginator() }
  ]
})
export class AccountProcessModule { }
