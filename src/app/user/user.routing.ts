import { Routes } from '@angular/router';
import { UserAccountsComponent } from '../_shared/user-accounts/user-accounts.component';

export const UserRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'config',
        loadChildren: () => import('./config/user-config.module').then(m => m.UserConfigModule)
      },
      {
        path: 'process',
        loadChildren: () => import('./process/user-process.module').then(m => m.UserProcessModule)
      },
      {
        path: 'job',
        loadChildren: () => import('./job/job-opportunities.module').then(m => m.JobOpportunitinesModule)
      },
      { path: '',   redirectTo: 'process', pathMatch: 'prefix' }
    ]
  }
];
