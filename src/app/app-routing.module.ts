import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserQuizComponent } from './user/user-quiz/user-quiz.component';
import { AccountGuard } from './_guards/account.guard';
import { AdminGuard } from './_guards/admin.guard';
import { LoginGuard } from './_guards/login.guard';
import { UserGuard } from './_guards/user.guard';
import { BlankComponent } from './_layouts/blank/blank.component';
import { FullComponent } from './_layouts/full/full.component';
import { UserAccountsComponent } from './_shared/user-accounts/user-accounts.component';

const routes: Routes = [
  {
    path: '',
    component: FullComponent,
    canActivate: [LoginGuard],
    children: [
      {
        path: 'admin',
        loadChildren: () => import('./admin/admin.module').then(m => m.AdminModule),
        canActivateChild: [AdminGuard]
      },
      {
        path: 'account',
        loadChildren: () => import('./account/account.module').then(m => m.AccountModule),
        canActivateChild: [AccountGuard]
      },
      {
        path: 'user',
        loadChildren: () => import('./user/user.module').then(m => m.UserModule),
        canActivateChild: [UserGuard]
      },
      {
        path: 'user-accounts',
        component: UserAccountsComponent,
        data: {
          title: 'talentbits- Mis cuentas',
          routeName: 'main',
          urls: [
              { label: 'Inicio', url: '/' },
              // { label: 'Account', url: '/user', replace: '${replace-account-name}' },
              { label: 'Mis cuentas' },
          ]
        }
      },
    ]
  },
  {
    path: 'authentication',
    component: BlankComponent,
    children: [
      {
        path: '',
        loadChildren:
          () => import('./authentication/authentication.module').then(m => m.AuthenticationModule)
      }
    ]
  }, {
    path: 'quiz',
    component: UserQuizComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
