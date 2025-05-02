import { Routes } from "@angular/router";
import { ProcessEvaluationsComponent } from "./detail/process-evaluations/process-evaluations.component";
import { ProcessInformationComponent } from "./detail/process-information/process-information.component";
import { ProcessRequestsComponent } from "./detail/process-requests/process-requests.component";
import { ProcessResumeComponent } from "./detail/process-resume/process-resume.component";
import { ProcessStepsComponent } from "./detail/process-steps.component";
import { ProcessVaccantComponent } from "./detail/process-vaccant/process-vaccant.component";
import { ProcessListComponent } from "./process-list/process-list.component";
import { ReportParticipantsComponent } from "./reports/report-participants/report-participants.component";
import { ReportTeamComponent } from "./reports/report-team/report-team.component";
import { ReportsComponent } from "./reports/reports.component";

export const AccountProcessRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'main',
        component: ProcessListComponent,
        data: {
          title: 'Procesos',
          routeName: 'main',
          urls: [
            { label: 'Inicio', url: '/account/config' },
            { label: 'Procesos', url: '/account/process' },
          ]
        }
      },
      {
        path: 'main/:action',
        component: ProcessListComponent,
        data: {
          title: 'Procesos',
          routeName: 'main',
          urls: [
            { label: 'Inicio', url: '/account/config' },
            { label: 'Procesos', url: '/account/process' },
          ]
        }
      },
      {
        path: 'item',
        component: ProcessStepsComponent,
        children: [
          {
            path: 'detail',
            component: ProcessInformationComponent,
            data: {
              title: 'Proceso - Detalle',
              routeName: 'info',
              urls: [
                { label: 'Inicio', url: '/account/config' },
                { label: 'Procesos', url: '/account/process' },
                { label: 'Item', url: '/account/process/item/detail', replace: '${replace-process-name}' },
                { label: 'Detalle' }
              ]
            },
          },
          {
            path: 'evaluations',
            component: ProcessEvaluationsComponent,
            data: {
              title: 'Proceso - Evaluaciones',
              routeName: 'evaluations',
              urls: [
                { label: 'Inicio', url: '/account/config' },
                { label: 'Procesos', url: '/account/process' },
                { label: 'Item', url: '/account/process/item/detail', replace: '${replace-process-name}' },
                { label: 'Evaluaciones' }
              ]
            },
          },
          {
            path: 'requests',
            component: ProcessRequestsComponent,
            data: {
              title: 'Proceso - Participantes',
              routeName: 'requests',
              urls: [
                { label: 'Inicio', url: '/account/config' },
                { label: 'Procesos', url: '/account/process' },
                { label: 'Item', url: '/account/process/item/detail', replace: '${replace-process-name}' },
                { label: 'Participantes' }
              ]
            },
          },
          {
            path: 'vaccant',
            component: ProcessVaccantComponent,
            data: {
              title: 'Proceso - Vacante',
              routeName: 'requests',
              urls: [
                { label: 'Inicio', url: '/account/config' },
                { label: 'Procesos', url: '/account/process' },
                { label: 'Item', url: '/account/process/item/detail', replace: '${replace-process-name}' },
                { label: 'Vacante' }
              ]
            },
          },
          {
            path: 'resume',
            component: ProcessResumeComponent,
            data: {
              title: 'Proceso - Resumen y envío',
              routeName: 'resume',
              urls: [
                { label: 'Inicio', url: '/account/config' },
                { label: 'Procesos', url: '/account/process' },
                { label: 'Item', url: '/account/process/item/detail', replace: '${replace-process-name}' },
                { label: 'Resumen y envío' }
              ]
            },
          },
          { path: '', redirectTo: 'detail', pathMatch: 'prefix' }
        ]
      },
      {
        path: 'reports',
        component: ReportsComponent,
        children: [
          {
            path: 'team',
            component: ReportTeamComponent,
            data: {
              title: 'Proceso - Reporte por equipo',
              routeName: 'team',
              urls: [
                { label: 'Inicio', url: '/account/config' },
                { label: 'Procesos', url: '/account/process' },
                { label: 'Item', url: '/account/process/item/detail', replace: '${replace-process-name}' },
                { label: 'Reporte por equipo' }
              ]
            },
          },
          {
            path: 'participants',
            component: ReportParticipantsComponent,
            data: {
              title: 'Proceso - Reporte por participantes',
              routeName: 'participants',
              urls: [
                { label: 'Inicio', url: '/account/config' },
                { label: 'Procesos', url: '/account/process' },
                { label: 'Item', url: '/account/process/item/detail', replace: '${replace-process-name}' },
                { label: 'Reporte por participantes' }
              ]
            },
          },
          { path: '', redirectTo: 'team', pathMatch: 'prefix' }
        ]
      },
      { path: '', redirectTo: 'main', pathMatch: 'prefix' }
    ]
  }
];