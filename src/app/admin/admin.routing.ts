import { Routes } from '@angular/router';
import { PlanListComponent } from './plan-list/plan-list.component';

export const AdminRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'accounts',
        loadChildren: () => import('./accounts/accounts.module').then(m => m.AccountsModule),
      },
      {
        path: 'evaluations',
        loadChildren: () => import('./evaluation/evaluation.module').then(m => m.EvaluationModule),
      },
      {
        path: 'plans',
        component: PlanListComponent,
        data: {
          title: 'Talentbits - Planes',
          urls: [
            { label: 'Inicio', url: '/admin' },
            { label: 'Lista de planes' }
          ]
        }
      },
      { path: '', redirectTo: 'accounts', pathMatch: 'prefix' }
    ]
  }
];
