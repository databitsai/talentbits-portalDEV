import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { iif, Subject, of, throwError, merge } from 'rxjs';
import { map, mergeMap, takeUntil } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { ProcessRequest } from 'src/app/_models/ProcessRequest';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { ProcessRequestApiService } from 'src/app/_services/api/process-request-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { CATALOG_PROCESS_STATE, PATTERN_EMAIL, PATTERN_NAMES, PATTERN_PASSWORD, PATTERN_PHONE, PROCESS_REQUEST_STATE_PENDING } from 'src/app/_utils/constants';

interface CheckInviteParams {
  code: string;
}
// ------------------- MESSAGE------------------
@Component({
  selector: 'app-invite-message',
  templateUrl: './invite-message.html',
  styleUrls: ['./invite.component.scss']
})
export class InviteMessageComponent implements OnInit {
  @Input() message = '';
  constructor() { }
  ngOnInit() { }
}
// ------------------- REGISTER------------------
@Component({
  selector: 'app-invite-register',
  templateUrl: './invite-register.html',
  styleUrls: ['./invite.component.scss']
})
export class InvitRegisterComponent implements OnInit {
  @Input() message = '';
  @Input() item: ProcessRequest = Object.create({});
  // catalogs
  states: Catalog[] = [];
  // variables
  state = PROCESS_REQUEST_STATE_PENDING;
  constructor(private readonly _catalogApi: CatalogApiService,
    private spinner: NgxSpinnerService,
    private readonly _processRequestApi: ProcessRequestApiService,
    private toast: CustomToastService) { }
  ngOnInit() {
    this.spinner.show("load");
    this._catalogApi.findAllByType(CATALOG_PROCESS_STATE)
      .pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
      )
      .subscribe((resp: Catalog[]) => {
        this.states = resp;
        this.state = this.getValueState(this.item.status);
        console.log(this.state);
        this.spinner.hide("load");
      }, err => {
        console.log(err);
        this.spinner.hide("load");
      });
  }
  onSubmit() {
    this.spinner.show("load");
    this._processRequestApi.register(this.item.id, this.item.code).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp), throwError(resp)))
    ).subscribe((resp: ResponseApi) => {
      console.log(resp);
      this.item = resp.result;
      this.state = this.getValueState(this.item.status);
      this.toast.addPrimeToast('success', '', resp.message);
      this.spinner.hide("load");
    }, err => {
      console.log(err);
      this.spinner.hide("load");
      this.toast.addPrimeToast('error', '', err.error.message);
    });
  }
  getValueState(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'NE';
  }
}
// ------------------- ADD------------------
@Component({
  selector: 'app-invite-add',
  templateUrl: './invite-add.html',
  styleUrls: ['./invite.component.scss']
})
export class InviteAddComponent implements OnInit {
  @Input() message = '';
  @Input() item: ProcessRequest = Object.create({});
  // catalogs
  states: Catalog[] = [];
  // variables
  state = PROCESS_REQUEST_STATE_PENDING;
  constructor(private readonly _catalogApi: CatalogApiService,
    private spinner: NgxSpinnerService,
    private readonly _processRequestApi: ProcessRequestApiService,
    private toast: CustomToastService) { }
  ngOnInit() {
    this.spinner.show("load");
    this._catalogApi.findAllByType(CATALOG_PROCESS_STATE)
      .pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
      )
      .subscribe((resp: Catalog[]) => {
        this.states = resp;
        this.state = this.getValueState(this.item.status);
        this.spinner.hide("load");
      }, err => {
        console.log(err);
        this.spinner.hide("load");
      });
  }
  onSubmit() {
    this.spinner.show("load");
    this._processRequestApi.add(this.item.id, this.item.code).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp), throwError(resp)))
    ).subscribe((resp: ResponseApi) => {
      console.log(resp);
      this.item = resp.result;
      this.state = this.getValueState(this.item.status);
      this.toast.addPrimeToast('success', '', resp.message);
      this.spinner.hide("load");
    }, err => {
      console.log(err);
      this.spinner.hide("load");
      this.toast.addPrimeToast('error', '', err.error.message);
    });
  }
  getValueState(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'NE';
  }
}
// ------------------- NEW------------------
@Component({
  selector: 'app-invite-new',
  templateUrl: './invite-new.html',
  styleUrls: ['./invite.component.scss']
})
export class InviteNewComponent implements OnInit {
  @Input() message = '';
  @Input() item: ProcessRequest = Object.create({});
  // forms
  userForm!: FormGroup;
  accessForm!: FormGroup;
  patternPassword = PATTERN_PASSWORD;
  // catalogs
  states: Catalog[] = [];
  // variables
  state = PROCESS_REQUEST_STATE_PENDING;
  constructor(private fb: FormBuilder,
    private readonly _catalogApi: CatalogApiService,
    private spinner: NgxSpinnerService,
    private readonly _processRequestApi: ProcessRequestApiService,
    private toast: CustomToastService) { }
  ngOnInit() {
    this.userForm = this.fb.group({
      firstName: [this.item.firstName, Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
      lastName: [this.item.lastName, Validators.compose([Validators.required, Validators.maxLength(45), Validators.pattern(PATTERN_NAMES)])],
      dni: ['', Validators.compose([Validators.required, Validators.maxLength(45)])],
      phone: ['', Validators.compose([Validators.maxLength(45), Validators.pattern(PATTERN_PHONE)])]
    });
    this.accessForm = this.fb.group({
      username: [this.item.email, Validators.compose([Validators.required, Validators.maxLength(150), Validators.pattern(PATTERN_EMAIL)])],
      password: ['', Validators.compose([Validators.required, Validators.minLength(7), Validators.pattern(PATTERN_PASSWORD)])]
    });
    this.userForm.get('dni')?.reset();
    this.userForm.get('phone')?.reset();
    this.accessForm.get('username')?.disable();
    this.accessForm.get('password')?.reset();
    this.spinner.show("load");
    this._catalogApi.findAllByType(CATALOG_PROCESS_STATE)
      .pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
      )
      .subscribe((resp: Catalog[]) => {
        this.states = resp;
        this.state = this.getValueState(this.item.status);
        this.spinner.hide("load");
      }, err => {
        console.log(err);
        this.spinner.hide("load");
      });
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
      this.accessForm.get('username')?.enable();
      const request: any = {
        ...this.userForm.value,
        ...this.accessForm.value,
        id: this.item.id,
        code: this.item.code
      };
      this.spinner.show("load");
      this._processRequestApi.newInvited(request).pipe(
        mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp), throwError(resp)))
      ).subscribe((resp: ResponseApi) => {
        console.log(resp);
        this.item = resp.result;
        this.state = this.getValueState(this.item.status);
        this.toast.addPrimeToast('success', '', resp.message);
        this.spinner.hide("load");
      }, err => {
        console.log(err);
        this.spinner.hide("load");
        this.toast.addPrimeToast('error', '', err.error.message);
      }, () => {
        this.accessForm.get('username')?.disable();
      });
    } else {
      this.validateAllFormFields(this.userForm);
      this.validateAllFormFields(this.accessForm);
    }
  }
  getValueState(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'NE';
  }
}
// -------------MAIN------------------
@Component({
  selector: 'app-invite',
  templateUrl: './invite.component.html',
  styleUrls: ['./invite.component.scss']
})
export class InviteComponent implements OnInit {

  ngUnsubscribe: Subject<any> = new Subject<any>();
  action = 'error';
  loading = true;
  message = '';
  item: ProcessRequest = Object.create({});

  wrapperClassGrid = "p-col-12 p-md-8 p-lg-4";

  constructor(private activatedRoute: ActivatedRoute,
    private _processRequestApi: ProcessRequestApiService,
    private spinner: NgxSpinnerService) { }

  ngOnInit(): void {
    this.activatedRoute.queryParams
      .pipe(
        takeUntil(this.ngUnsubscribe),
        map((resp: any) => <CheckInviteParams>resp),
        mergeMap((params: CheckInviteParams) => iif(() => params.code !== undefined, of(params), throwError('PARAMS EMPTY')))
      )
      .subscribe((params: CheckInviteParams) => {
        // this.router.navigate(['/']);
        this.validate(params);
      }, err => {
        console.log(err);
        // this.router.navigate(['/authentication/login']);
      });
  }
  validate(params: CheckInviteParams) {
    this.loading = true;
    this.spinner.show("load");
    this._processRequestApi.validate(params).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp), throwError(resp)))
    )
      .subscribe((resp: ResponseApi) => {
        console.log(resp);
        this.loading = false;
        this.item = resp.result;
        this.message = resp.message;
        this.action = this.item.action;
        this.spinner.hide("load");
        if (this.action === 'new') {
          this.wrapperClassGrid = 'p-col-12 p-md-8 p-lg-5';
        }
      }, err => {
        console.log(err);
        this.loading = false;
        this.action = 'error';
        this.message = err.error.message ?? 'ND';
        this.spinner.hide("load");
      });
  }

}
