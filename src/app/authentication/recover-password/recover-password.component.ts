import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { AuthenticationService } from 'src/app/_services/security/authentication.service';
import { PATTERN_EMAIL } from 'src/app/_utils/constants';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent implements OnInit {

  loginForm!: FormGroup;
  submitted = false;

  constructor(private fb: FormBuilder,
    private toast: CustomToastService,
    private readonly _auhtApi: AuthenticationService,
    private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_EMAIL)])]
    });
  }

  get username() { return this.loginForm.get('username'); }

  onSubmit() {
    if (this.loginForm.valid) {
      this.spinner.show("load");
      this._auhtApi.sendRecoverPasswordEmail(this.loginForm.get('username')?.value).subscribe((resp: ResponseApi) => {
        console.log(resp);
        this.submitted = true;
        this.spinner.hide("load");
      }, err => {
        console.log(err);
        this.toast.addPrimeToast('info', '',err.error.message);
        this.spinner.hide("load");
      });
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
  reset() {
    this.loginForm.reset();
    this.submitted = false;
  }

}
