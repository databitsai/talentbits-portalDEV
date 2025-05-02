import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxSpinnerModule } from 'ngx-spinner';
import { PrimengCustomModule } from 'src/app/_primeng/primeng-custom.module';
import { MaterialCustomModule } from 'src/app/_material/material-custom.module';
import { AccountConfigRoutes } from './account-config-routing.module';
import { UsersComponent } from './users/users.component';
import { PlanCompanyComponent, PlanComponent, PlanOptionsComponent, PlanPaymentComponent, PlanPlanComponent } from './plan/plan.component';



@NgModule({
  declarations: [
    UsersComponent,
    PlanComponent,
    PlanCompanyComponent,
    PlanPlanComponent,
    PlanOptionsComponent,
    PlanPaymentComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(AccountConfigRoutes),
    PrimengCustomModule,
    MaterialCustomModule,
    TranslateModule,
    ReactiveFormsModule,
    NgxSpinnerModule
  ]
})
export class AccountConfigModule { }
