import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule, Title } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SharedAppModule } from './_shared/shared.module';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BlankComponent } from './_layouts/blank/blank.component';
import { PrimengCustomModule } from './_primeng/primeng-custom.module';
import { FullComponent } from './_layouts/full/full.component';
import { ConfirmationService, MessageService, SharedModule } from 'primeng/api';
import { AdminGuard } from './_guards/admin.guard';
import { LoginGuard } from './_guards/login.guard';
import { HttpConfigInterceptor } from './app.interceptor';
import { MaterialCustomModule } from './_material/material-custom.module';
import { AccountGuard } from './_guards/account.guard';
import { UserGuard } from './_guards/user.guard';


export function httpTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    BlankComponent,
    FullComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    PrimengCustomModule,
    SharedModule,
    SharedAppModule,
    RouterModule,
    MaterialCustomModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: httpTranslateLoader,
        deps: [HttpClient]
      }
    }),
  ],
  providers: [
    Title,
    MessageService,
    AdminGuard,
    LoginGuard,
    AccountGuard,
    UserGuard,
    { provide: HTTP_INTERCEPTORS, useClass: HttpConfigInterceptor, multi: true },
    ConfirmationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
