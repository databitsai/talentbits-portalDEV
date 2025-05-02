import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { iif, of, Subject, throwError } from 'rxjs';
import { map, mergeMap, takeUntil, tap } from 'rxjs/operators';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { AuthenticationService } from 'src/app/_services/security/authentication.service';
import { PATTERN_EMAIL, PATTERN_PASSWORD } from 'src/app/_utils/constants';

interface CustomParams {
  code: string;
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  loginForm!: FormGroup;
  submitted = false;
  action = "reset_password";

  ngUnsubscribe: Subject<any> = new Subject<any>();
  codeValid = false;

  params!: CustomParams;
  messageCode = '...';

  constructor(private fb: FormBuilder,
    private toast: CustomToastService,
    private readonly _auhtApi: AuthenticationService,
    private spinner: NgxSpinnerService,
    private activatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      password: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_PASSWORD)])],
      passwordVerify: ['', Validators.compose([Validators.required])]
    });
    this.spinner.show("load");
    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.ngUnsubscribe),
        map((resp: any) => <CustomParams>resp),
        mergeMap((params: CustomParams) => iif(() => params.code !== undefined, of(params), throwError('PARAMS EMPTY'))),
        tap((resp: CustomParams) => {
          this.params = resp;
        }),
        mergeMap((params: CustomParams) => this._auhtApi.verifyAction({action: this.action, code: params.code}))
      )
      .subscribe((params: ResponseApi) => {
        console.log(params);
        this.codeValid = params.result;
        this.messageCode = params.message;
        this.spinner.hide("load");
      }, err => {
        console.log(err);
        this.spinner.hide("load");
      });
  }

  get password() { return this.loginForm.get('password'); }
  get passwordVerify() { return this.loginForm.get('passwordVerify'); }

  onSubmit() {
    if (this.loginForm.valid) {
      if (this.password?.value === this.passwordVerify?.value) {
        const request: any = {
          password: this.password?.value,
          action: this.action,
          ...this.params
        }
        this.spinner.show("load");
      this._auhtApi.changePassword(request).subscribe((resp: ResponseApi) => {
        this.submitted = resp.result;
        this.spinner.hide("load");
      }, err => {
        console.log(err);
        this.toast.addPrimeToast('info', '',err.error.message);
        this.spinner.hide("load");
      });
      } else {
        this.toast.addPrimeToast('info', '', "Las contraseñas no son iguales");
      }
    } else {
      this.validateAllFormFields(this.loginForm);
    }
  }
  validateAllFormFields(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof FormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof FormGroup) {
        this.validateAllFormFields(control);
      }
    });
  }

}
