import { Routes } from "@angular/router";
import { VaccantDetailComponent } from "./detail/vaccant-detail/vaccant-detail.component";
import { VaccantResumeComponent } from "./detail/vaccant-resume/vaccant-resume.component";
import { VaccantListComponent } from "./vaccant-list/vaccant-list.component";
import { VaccantStepComponent } from "./detail/vaccant-steps.component";
import { ApplicantListComponent } from "./applicant-list/applicant-list.component";


export const VaccantRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'main',
        component: VaccantListComponent,
        data: {
          title: 'Vacantes',
          routeName: 'main',
          urls: [
            { label: 'Inicio' , url: '/account/config' },
            { label: 'Vacantes' ,url: '/account/vaccant' },
          ]
        }
      },
      {
        path: 'main/:action',
        component: VaccantListComponent,
        data: {
          title: 'Vacantes',
          routeName: 'main',
          urls: [
            { label: 'Inicio' , url: '/account/config' },
            { label: 'Vacantes' ,url: '/account/vaccant' },
          ]
        }
      },
      {
        path: 'list-applicant',
        component: ApplicantListComponent,
        data: {
          title: 'Lista de aplicantes',
          routeName: 'applicant',
          urls: [
            { label: 'Inicio', url: '/account/config' },
            { label: 'Vacantes', url: '/account/vaccant' },
            { label: 'Aplicantes' },
          ],
        },
      },

      {
        path: 'detail',
        component: VaccantDetailComponent,
        data: {
          title: 'Editar Vacante',
          routeName: 'applicant',
          urls: [
            { label: 'Inicio', url: '/account/config' },
            { label: 'Vacantes', url: '/account/vaccant' },
            { label: 'Detalle', url: '/account/vaccant/detail' },
            { label: 'Actualizar vacante' },
          ],
        },
      },

      {
        path: 'item',
        component: VaccantStepComponent,
        children: [
          {
            path: 'detail',
            component: VaccantDetailComponent,
            data: {
              title: 'Vacante',
              routeName: 'detail',
              urls: [
                { label: 'Inicio', url: '/account/config'},
                { label: 'Vacantes', url: '/account/vaccant' },
                { label: 'Detalle', url: '/account/vaccant/detail' },
              ]
            }
          },
    
          {
            path: 'resume',
            component: VaccantResumeComponent,
            data: {
              title: 'Vacante',
              routeName: 'resume',
              urls: [
                { label: 'Inicio', url: '/account/config'},
                { label: 'Vacantes', url: '/account/vaccant' },
                { label: 'Resumen y envío', url: '/account/vaccant/item/resume' },
              ]
            }
          },

          { path: '', redirectTo: 'detail', pathMatch: 'prefix' }
        ]
      },

      { path: '', redirectTo: 'main', pathMatch: 'prefix' }
    ]
  },
  
];