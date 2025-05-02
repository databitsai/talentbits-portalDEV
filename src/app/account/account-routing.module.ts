import { Routes } from '@angular/router';

export const AccountRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'config',
        loadChildren: () => import('./config/account-config.module').then(m => m.AccountConfigModule)
      },
      {
        path: 'process',
        loadChildren: () => import('./process/account-process.module').then(m => m.AccountProcessModule)
      },
      {
        path: 'vaccant',
        loadChildren: () => import('./vaccant/vaccant.module').then(m => m.VaccantModule)
      },
      { path: '',   redirectTo: 'config', pathMatch: 'prefix' }
    ]
  }
];
