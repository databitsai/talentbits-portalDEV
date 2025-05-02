import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { Authority } from 'src/app/_models/Authority';
import { TokenClaims } from 'src/app/_models/TokenClaims';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { AuthenticationService } from 'src/app/_services/security/authentication.service';
import { RoutesRolesService } from 'src/app/_services/security/routes-roles.service';
import { PATTERN_EMAIL } from 'src/app/_utils/constants';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm!: FormGroup;

  constructor(private fb: FormBuilder,
    private toast: CustomToastService,
    private translateService: TranslateService,
    private _auth: AuthenticationService,
    private router: Router,
    private routesRoles: RoutesRolesService,
    private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_EMAIL)])],
      password: ['', Validators.compose([Validators.required, Validators.maxLength(150)])]
    });
  }
  get username() { return this.loginForm.get('username'); }
  get password() { return this.loginForm.get('password'); }
  onSubmit() {
    if (this.loginForm.valid) {
      this.spinner.show("load");
      this._auth.login(this.username?.value, this.password?.value).subscribe((resp: Authority[]) => {
        this.spinner.hide("load");
        if (resp.length > 0 && resp.length === 2) {
          if (resp.length === 2) {
            const claims: TokenClaims = this._auth.getTokenClaims();
            this.spinner.show("load");
            this.routesRoles.setRoleObjects(claims, resp[0].authority).subscribe((setting: any) => {
              this.spinner.hide("load");
              this.router.navigate([this.routesRoles.getAccessRoute(resp[0].authority)]);
            }, err => {
              this.spinner.hide("load");
              console.log(err);
              this.toast.addPrimeToast('info', '', this.translateService.instant('t.tryAgainLater'));
            });
          } else {
            console.log(resp.length);
            this.toast.addPrimeToast('info', '', this.translateService.instant('t.tryAgainLater'));
          }
        } else {
          this.toast.addPrimeToast('info', '', this.translateService.instant('t.rolesInvalid'));
        }
      }, err => {
        console.log(err);
        this.spinner.hide("load");
        this.toast.addPrimeToast('error', '', err.error.message);
      });
    } else {
      this.toast.addPrimeToast('info', '', this.translateService.instant('t.formInvalid'));
    }
  }


}
