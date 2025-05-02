import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthenticationRoutes } from './authentication.routing';
import { LoginComponent } from './login/login.component';
import { PrimengCustomModule } from '../_primeng/primeng-custom.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { InviteAddComponent, InviteComponent, InviteMessageComponent, InviteNewComponent, InvitRegisterComponent } from './invite/invite.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MaterialCustomModule } from '../_material/material-custom.module';
import { RecoverPasswordComponent } from './recover-password/recover-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';


@NgModule({
  declarations: [
    LoginComponent,
    InviteComponent,
    InviteMessageComponent,
    InvitRegisterComponent,
    InviteAddComponent,
    InviteNewComponent,
    RecoverPasswordComponent,
    ResetPasswordComponent
  ],
  imports: [
    CommonModule,
    PrimengCustomModule,
    RouterModule.forChild(AuthenticationRoutes),
    TranslateModule,
    ReactiveFormsModule,
    NgxSpinnerModule,
    MaterialCustomModule
  ]
})
export class AuthenticationModule { }
