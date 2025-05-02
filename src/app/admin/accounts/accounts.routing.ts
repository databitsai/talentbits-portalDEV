import { Routes } from '@angular/router';
import { AccountListComponent } from './account-list/account-list.component';
import { CreateAccountAdministratorComponent } from './create-account-administrator/create-account-administrator.component';
import { CreateAccountCorporativeComponent } from './create-account-corporative/create-account-corporative.component';

export const AccountsRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'corporative',
        children: [
          {
            path: 'list',
            component: AccountListComponent,
            data: {
              title: 'Cuentas empresariales',
              routeName: 'corporative',
              urls: [
                { label: 'Inicio', url: '/admin' },
                { label: 'Cuentas empresariales' }
              ]
            },
          },
          {
            path: 'create',
            component: CreateAccountCorporativeComponent,
            data: {
              title: 'Crear cuenta empresarial',
              urls: [
                { label: 'Inicio', url: '/admin' },
                { label: 'Usuarios de la empresa', url: '/admin/accounts/corporative' },
                { label: 'Crear cuenta empresarial' }
              ]
            }
          },
          {
            path: 'account',
            loadChildren: () => import('../../account/account.module').then(m => m.AccountModule)
          },
          { path: '',   redirectTo: 'list', pathMatch: 'full' }
        ]
      }, {
        path: 'administrator',
        children: [
          {
            path: 'list',
            component: AccountListComponent,
            data: {
              title: 'Cuentas administrativas',
              routeName: 'administrator',
              urls: [
                { label: 'Inicio', url: '/admin' },
                { label: 'Cuentas administrativas' }
              ]
            },
          },
          {
            path: 'create',
            component: CreateAccountAdministratorComponent,
            data: {
              title: 'Crear cuenta administrativa',
              urls: [
                { label: 'Inicio', url: '/admin' },
                { label: 'Usuarios administrativos', url: '/admin/accounts/administrator' },
                { label: 'Crear cuenta administrativa' }
              ]
            }
          },
          { path: '',   redirectTo: 'list', pathMatch: 'full' }
        ]
      },
      { path: '',   redirectTo: 'corporative', pathMatch: 'full' }
    ]
  }
];
