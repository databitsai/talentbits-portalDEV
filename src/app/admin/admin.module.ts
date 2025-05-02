import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AdminRoutes } from './admin.routing';
import { PrimengCustomModule } from '../_primeng/primeng-custom.module';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialCustomModule } from '../_material/material-custom.module';
import { PlanListComponent } from './plan-list/plan-list.component';
import { AccountsModule } from './accounts/accounts.module';



@NgModule({
  declarations: [
    PlanListComponent
  ],
  imports: [
    CommonModule,
    PrimengCustomModule,
    RouterModule.forChild(AdminRoutes),
    TranslateModule,
    ReactiveFormsModule,
    MaterialCustomModule,
    AccountsModule
  ]
})
export class AdminModule { }


