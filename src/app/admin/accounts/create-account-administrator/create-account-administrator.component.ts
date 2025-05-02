import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { NgxSpinnerService } from 'ngx-spinner';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { AccountApiService } from 'src/app/_services/api/account-api.service';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { PlanApiService } from 'src/app/_services/api/plan-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { CATALOG_SUBROLE, PATTERN_EMAIL, PATTERN_NAMES, PATTERN_PASSWORD } from 'src/app/_utils/constants';


@Component({
  selector: 'app-create-account-administrator',
  templateUrl: './create-account-administrator.component.html',
  styleUrls: ['./create-account-administrator.component.scss']
})
export class CreateAccountAdministratorComponent implements OnInit {

 // catalogs
 subroles: Catalog[] = [];
 // forms
 userForm!: FormGroup;
 accessForm!: FormGroup;
 // variables
 loadData = false;
 patternPassword = PATTERN_PASSWORD;
 subroleSelectedValue!: string;

 constructor(private fb: FormBuilder,
   private readonly _catalogAPi: CatalogApiService,
   private readonly _accountApi: AccountApiService,
   private toast: CustomToastService,
   private router: Router,
   private translateService: TranslateService,
   private spinner: NgxSpinnerService) { }

 ngOnInit(): void {
   // Forms
   this.userForm = this.fb.group({
     firstName: ['', Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
     lastName: ['', Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
     dni: ['', Validators.compose([Validators.required, Validators.maxLength(45)])],
     role: ['', Validators.required]
   });
   this.accessForm = this.fb.group({
     username: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_EMAIL)])],
     password: ['', Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_PASSWORD)])]
   });
   this.spinner.show("load");
   this.loadCatalogs().subscribe((catalogs: [Catalog[]]) => {
    this.subroles = catalogs[0];
    this.spinner.hide("load");
   }, err => {
     console.log(err);
     this.spinner.hide("load");
   });
 }
 loadCatalogs(): Observable<any> {
  const subrolesCatalog$ = this._catalogAPi.findAllByType(CATALOG_SUBROLE)
    .pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
  return zip(subrolesCatalog$);
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
 onSubmit() {
   if (this.userForm.valid && this.accessForm.valid) {
     this.spinner.show("save");
     const request: any = {
       ...this.userForm.value,
       ...this.accessForm.value
     };
     console.log(request);
     this._accountApi.creatAdministrator(request).subscribe((resp: ResponseApi) => {
       this.toast.addPrimeToast('success', '', resp.message);
       this.router.navigate(['admin', 'accounts', 'administrator']);
       this.spinner.hide("save");
     }, err => {
       console.log(err);
       this.toast.addPrimeToast('error', '', err.error.message);
       this.spinner.hide("save");
     }, () => {
     });
   } else {
     this.toast.addPrimeToast('error', '', this.translateService.instant('t.forminvalid')); //TODO:
   }
 }

}
