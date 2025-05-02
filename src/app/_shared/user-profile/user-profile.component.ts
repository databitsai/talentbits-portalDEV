import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, of } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { Authority } from 'src/app/_models/Authority';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { TokenClaims } from 'src/app/_models/TokenClaims';
import { UserApp } from 'src/app/_models/UserApp';
import { UserApiService } from 'src/app/_services/api/user-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { AuthenticationService } from 'src/app/_services/security/authentication.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, PATTERN_EMAIL, PATTERN_PHONE, ROLE_ACCESS_USER, STORAGE_LOCAL, TOKEN_INFO_ACCESS, TOKEN_INFO_LABEL } from 'src/app/_utils/constants';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  // forms
  userForm!: FormGroup;
  // variables
  loadData = false;
  showFormEdit = false;
  accountSelected: AccountResume = Object.create({});
  user: UserApp = Object.create({});
  tokenClaims!: TokenClaims;
  authorities: Authority[] = [];
  isUser = false;
  cvName = "-";
  existCv = false;
  uploading = false;

  uploadedFiles: any[] = [];

  constructor(private fb: FormBuilder,
    private readonly _authApi: AuthenticationService,
    private readonly _userAppApi: UserApiService,
    private spinner: NgxSpinnerService,
    private toast: CustomToastService,
    private _storage: StorageService,
    private confirmationService: ConfirmationService) {
    this.tokenClaims = this._authApi.parseJwt(this._authApi.getTokenStored());
    this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
    this.accountSelected= this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
  }

  ngOnInit(): void {
    this.isUser = this.authorities.map(i => i.authority).some(i => i === ROLE_ACCESS_USER);
    console.log(this.isUser);
    this.userForm = this.fb.group({
      id: [],
      firstName: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      lastName: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      dni: ['', Validators.compose([Validators.required, Validators.maxLength(13)])],
      phone: ['', Validators.compose([Validators.maxLength(45), Validators.pattern(PATTERN_PHONE)])]
    });
    this.spinner.show("load");
    this._userAppApi
    .fetchFromMembership(this.tokenClaims.memberid).pipe(
      tap((resp: ResponseApi) => {
        this.user = resp.result;
      }),
      mergeMap((resp: any) => iif(() => this.isUser, this._userAppApi.readCvFilename(this.tokenClaims.memberid), of(null)) )
    )
    .subscribe((resp: any) => {
      if (this.isUser) {
        this.existCv=true;
        this.cvName=resp.result;
      }
      this.spinner.hide("load");
    }, err => {
      console.log(err);
      this.toast.addPrimeToast('error', '', err.error?.message ?? err);
      this.spinner.hide("load");
    });
  }
  onCancelFormEdit() {
    this.userForm.reset();
    this.showFormEdit = false;
  }
  saveAccount() {
    if (this.userForm.valid) {
      this.spinner.show("load");
      this._userAppApi.update(this.userForm.value).subscribe((resp: ResponseApi) => {
        this.user = {
          ...this.user,
          ...resp.result
        };
        this.spinner.hide("load");
        this.showFormEdit = false;
        this.userForm.reset();
      }, err => {
        console.log(err);
        this.toast.addPrimeToast('error', '', err.error?.message ?? err);
        this.spinner.hide("load");
      });
    } else {
      this.validateAllFormFields(this.userForm);
    }
  }
  onShowFormEdit() {
    this.userForm.get('id')?.setValue(this.user.id);
    this.userForm.get('firstName')?.setValue(this.user.firstName);
    this.userForm.get('lastName')?.setValue(this.user.lastName);
    this.userForm.get('dni')?.setValue(this.user.dni);
    this.userForm.get('email')?.setValue(this.user.email);
    this.userForm.get('phone')?.setValue(this.user.phone);
    this.showFormEdit = true;
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
  uploadHandler(upload: any, button: any) {
    const reader = new FileReader();
    reader.readAsDataURL(upload.files[0]);
    reader.onload = () => {
        const base64: any = reader.result;
        const req: any = {
          idAccount: this.accountSelected.id,
          idMembership: this.tokenClaims.memberid,
          file: base64,
          filename: upload.files[0].name,
          type: upload.files[0].type,
          size: upload.files[0].size,
        };
        this.uploading = true;
        this._userAppApi.uploadCv(req).subscribe((resp: any) => {
          this.existCv = true;
          this.uploading = false;
          this.cvName = req.filename;
          button.clear();
        }, err => {
          this.uploading = false;
        });
    };
  }
  downloadCv() {
    this.spinner.show("load");
    this._userAppApi.readCvFile(this.tokenClaims.memberid).subscribe((resp: ResponseApi) => {
      const downloadLink      = document.createElement('a');
      downloadLink.target   = '_blank';
      downloadLink.download = this.cvName;
      downloadLink.href = resp.result;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      this.spinner.hide("load");
    }, err => {
      this.spinner.hide("load");
    });
  }
  deleteCv() {
    this.confirmationService.confirm({
      message: '¿Esta seguro de eliminar este archivo?',
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
              const req: any = {
                idAccount: this.accountSelected.id,
                idMembership: this.tokenClaims.memberid
              };
              this.spinner.show("load");
              this._userAppApi.deleteCv(req).subscribe((resp: ResponseApi) => {
                this.existCv = false;
                this.cvName = '-';
                this.spinner.hide("load");
              }, err => {
                this.spinner.hide("load");
              });
            }
    });
  }

}
