import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { PrimengCustomModule } from '../_primeng/primeng-custom.module';
import { UserMenuComponent } from './menu-user/user-menu.component';
import { AdminMenuComponent } from './menu-admin/admin-menu.component';
import { MenuAccountSelectorsComponent } from './menu-options-top/menu-options-top.component';
import { MenuCorporativeComponent } from './menu-corporative/menu-corporative.component';
import { UserAccountsComponent } from './user-accounts/user-accounts.component';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { CustomBadgeComponent } from './custom-badge/custom-badge.component';
import { GetUserEvaluationResultsComponent } from './get-user-evaluation-results/get-user-evaluation-results.component';
import { PipeSecondsToMinutesPipe } from './pipes/pipe-seconds-to-minutes.pipe';
import { PipeParseEllpasedTimePipe } from './pipes/pipe-parse-ellpased-time.pipe';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PipeFormatNamesPipe } from './pipes/pipe-format-names.pipe';
import { MenuGeneralComponent } from './menu-general/menu-general.component';


@NgModule({
  declarations: [
    BreadcrumbComponent,
    UserMenuComponent,
    AdminMenuComponent,
    MenuAccountSelectorsComponent,
    MenuCorporativeComponent,
    UserAccountsComponent,
    CustomBadgeComponent,
    GetUserEvaluationResultsComponent,
    PipeSecondsToMinutesPipe,
    PipeParseEllpasedTimePipe,
    UserProfileComponent,
    PipeFormatNamesPipe,
    MenuGeneralComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    PrimengCustomModule,
    TranslateModule,
    NgxSpinnerModule,
    ReactiveFormsModule
  ],
  exports: [
    BreadcrumbComponent,
    UserMenuComponent,
    AdminMenuComponent,
    MenuAccountSelectorsComponent,
    MenuCorporativeComponent,
    UserAccountsComponent,
    CustomBadgeComponent,
    GetUserEvaluationResultsComponent,
    PipeSecondsToMinutesPipe,
    PipeParseEllpasedTimePipe,
    UserProfileComponent,
    PipeFormatNamesPipe,
    MenuGeneralComponent
  ]
})
export class SharedAppModule { }
