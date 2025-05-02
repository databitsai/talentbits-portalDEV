import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccountRoutes } from './account-routing.module';
import { PrimengCustomModule } from '../_primeng/primeng-custom.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialCustomModule } from '../_material/material-custom.module';
import { NgxSpinnerModule } from 'ngx-spinner';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(AccountRoutes),
    PrimengCustomModule,
    MaterialCustomModule,
    TranslateModule,
    ReactiveFormsModule,
    NgxSpinnerModule
  ]
})
export class AccountModule { }
