import { Routes } from '@angular/router';
import { InviteComponent } from './invite/invite.component';
import { LoginComponent } from './login/login.component';
import { RecoverPasswordComponent } from './recover-password/recover-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';

export const AuthenticationRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: 'login',
        component: LoginComponent,
        data: {title: 'talentbits - Login'}
      },
      {
        path: 'invite',
        component: InviteComponent,
        data: {title: 'talentbits - Invitación'}
      },
      {
        path: 'recover',
        component: RecoverPasswordComponent,
        data: {title: 'talentbits - Recuperar contraseña'}
      },
      {
        path: 'reset-password',
        component: ResetPasswordComponent,
        data: {title: 'talentbits - Reestablecer contraseña'}
      },
      { path: '',   redirectTo: 'login', pathMatch: 'prefix' }
    ]
  }
];
