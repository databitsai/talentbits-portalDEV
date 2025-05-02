import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { PrimengCustomModule } from 'src/app/_primeng/primeng-custom.module';
import { MaterialCustomModule } from 'src/app/_material/material-custom.module';
import { AccountsRoutes } from './accounts.routing';
import { AccountListComponent } from './account-list/account-list.component';
import { CreateAccountCorporativeComponent } from './create-account-corporative/create-account-corporative.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import { CreateAccountAdministratorComponent } from './create-account-administrator/create-account-administrator.component';

@NgModule({
  declarations: [
    AccountListComponent,
    CreateAccountCorporativeComponent,
    CreateAccountAdministratorComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(AccountsRoutes),
    PrimengCustomModule,
    TranslateModule,
    ReactiveFormsModule,
    MaterialCustomModule,
    NgxSpinnerModule
  ]
})
export class AccountsModule { }


