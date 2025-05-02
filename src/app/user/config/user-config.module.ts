import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedAppModule } from 'src/app/_shared/shared.module';
import { RouterModule } from '@angular/router';
import { UserConfigRoutes } from './user-config.routing';


@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    SharedAppModule,
    RouterModule.forChild(UserConfigRoutes),
  ]
})
export class UserConfigModule { }
