import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, of, throwError, zip } from 'rxjs';
import { Observable } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { Catalog } from 'src/app/_models/Catalog';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { VaccantRequest } from 'src/app/_models/VaccantRequest';
import { Vaccant } from 'src/app/_models/Vaccant';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { ProcessApiService } from 'src/app/_services/api/process-api.service';
import { VaccantApiService } from 'src/app/_services/api/vaccant-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_PROCESS_STATE, CATALOG_PROJECT_TYPE, STORAGE_LOCAL, VACANT_SELECTED_ROUTE } from 'src/app/_utils/constants';
import { Plan } from 'src/app/_models/Plan';
import { UserApiService } from 'src/app/_services/api/user-api.service';

@Component({
  selector: 'app-applicant-list',
  templateUrl: './applicant-list.component.html',
  styleUrls: ['./applicant-list.component.scss']
})
export class ApplicantListComponent implements OnInit, OnDestroy{
  
  //Variables
  idVaccant!: any;
  accountSelected: AccountResume = Object.create({});
  itemDialog!: boolean;
  submitted: boolean = false;
  openListProcessDialog = false;

  //Table
  items: VaccantRequest[] = [];
  item!: VaccantApiService;

  //Catalogs
  processItems: ProcessApp[] = [];
  processByVaccant: ProcessApp[] = [];

  //Forms
  checkApplicantProcessForm!: FormGroup;

  vaccantSelected: Vaccant = Object.create(null);
  planSelected: Plan = Object.create({});

  inviteAll = false;


  constructor(
    private fb: FormBuilder,
    private toast: CustomToastService,
    private confirmationService: ConfirmationService,
    private readonly _vaccantApi: VaccantApiService,
    private _storage: StorageService,
    private spinner: NgxSpinnerService,
    private _router: Router,
    private readonly _userAppApi: UserApiService
  ) { 
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
    this.vaccantSelected = this._storage.getObject(STORAGE_LOCAL, VACANT_SELECTED_ROUTE);
  }
  

  ngOnInit(): void {
    this.idVaccant = this.vaccantSelected.id;

    this.checkApplicantProcessForm = this.fb.group({id: [],});

    const getParticipants$ = this._vaccantApi.findVaccantRequestByIdVaccant(this.idVaccant);
    const getVaccant$ = this._vaccantApi.findByIdVaccant(this.idVaccant);

    this.spinner.show("load");
    zip(getParticipants$, getVaccant$)
    .subscribe(
      (response: ResponseApi[]) => {
        this.items = response[0].result;
        this.inviteAll = this.items.every((item: any) => item.selected === true);
        this.vaccantSelected = response[1].result;
        this.spinner.hide("load");
      },
      (err) => {
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("load");
      }
    );

  }

  deleteItem(item: VaccantRequest) {
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quieres borrar ' + item.firstName + item.lastName + '?',
      header: 'Confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show('load');
        this._vaccantApi
          .deleteVaccantRequestById(item.id)
          .pipe(
            mergeMap((response: ResponseApi) =>
              iif(
                () => response.status === 'OK',
                of(response),
                throwError(response.message)
              )
            )
          )
          .subscribe(
            (resp: any) => {
              this.items = this.items.filter((val) => val.id !== item.id);
              this.item = Object.create({});
              this.toast.addPrimeToast('success', '', resp.message);
              this.spinner.hide('load');
            },
            (err) => {
              console.log(err);
              this.toast.addPrimeToast('error', '', err.error.message);
              this.spinner.hide('load');
            }
          );
      },
    });
  }

  
  onChangeSelected(id: number) {
    this._vaccantApi.selectRequestById(id).subscribe((resp: ResponseApi) => {
    }, err => {
      this.toast.addPrimeToast('error', '', err.error.message);
    });
    this.inviteAll = this.items.every((item: any) => item.selected === true);
  }

  // Screen controls
  openAddProcess() {
    this.openListProcessDialog = true;
    this.item = Object.create({});
    this.submitted = false;
  }

  hideDialog() {
    this.itemDialog = false;
    this.submitted = false;
    this.resetAllForms();
  }

  onHideCreate(event: any) {
    this.itemDialog = false;
    this.submitted = false;
    this.resetAllForms();
  }

  resetAllForms() {
    this.checkApplicantProcessForm.reset();
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

  //Destroy
  ngOnDestroy(): void {}

  openPage(pageUrl: string) {
    this._router.navigate([pageUrl]);
  }
  onSelectedProcess(item: Vaccant) {
    this.vaccantSelected = item;
    this.openListProcessDialog = false;
  }
  onDeleteProcess() {
    this.confirmationService.confirm({
      message: '¿Estás seguro que quiere quitar el proceso "' + this.vaccantSelected.process.name + '" de esta vacante?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show("load");
        const update$ = this._vaccantApi.updateIdProcessInVaccant(this.idVaccant, null);
        update$.subscribe((resp: ResponseApi) => {
          this.spinner.hide("load");
          this.toast.addPrimeToast('success', '', resp.message);
          this.vaccantSelected = resp.result;
        }, err => {
          console.log(err);
          this.toast.addPrimeToast('error', '', err.error.message);
          this.spinner.hide("load");
        });
      }
    });  
  }
  openNew() {
    this.confirmationService.confirm({
      message: '¿Estás seguro que quiere invitar a los aplicantes seleccionados al proceso "' + this.vaccantSelected.process.name + '" de esta vacante?<br><br>Nota: Los aplicantes que ya se encuentran en el proceso no seran transferidos.',
      header: 'Invitar a proceso',
      icon: 'pi pi-check-circle',
      accept: () => {
        this.spinner.show("load");
        const update$ = this._vaccantApi.transferRequestsToProcess(this.idVaccant);
        update$.subscribe((resp: ResponseApi) => {
          this.spinner.hide("load");
          this.toast.addPrimeToast('success', '', resp.message);
          this.items = resp.result;
        }, err => {
          console.log(err);
          this.toast.addPrimeToast('error', '', err.error.message);
          this.spinner.hide("load");
        });
      }
    });  
  }
  inviteAllToogle() {
    const request: any = {
      idProcess: this.vaccantSelected.id,
      selected: this.inviteAll
    };
    const auxItems = this.items.map((item: any) => {
      item.selected = this.inviteAll
      return item;
    });
    this.items = [
      ...auxItems
    ];
    this._vaccantApi.selectAllRequests(request).subscribe(() => { }, err => {
      console.log(err);
      this.toast.addPrimeToast('error', '', err.error.message);
    });
  }
  downloadCv(item: any) {
    let filename = '';
    this.spinner.show("load");
    this._userAppApi.readCvFilename(item.cv).pipe(
      mergeMap((resp: ResponseApi) => {
        filename = resp.result;
        return this._userAppApi.readCvFile(item.cv);
      })
    ).subscribe((resp: ResponseApi) => {
      const downloadLink      = document.createElement('a');
      downloadLink.target   = '_blank';
      downloadLink.download = filename;
      downloadLink.href = resp.result;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      this.spinner.hide("load");
    }, err => {
      console.log(err);
      this.spinner.hide("load");
    });
  }
}

@Component({
  selector: 'app-applicant-list-process',
  templateUrl: './applicant-list-process.component.html',
  styleUrls: ['./applicant-list.component.scss']
})
export class ApplicantListProcessComponent implements OnInit  {

  @Input() idAccount!: number;
  @Input() idVaccant!: number;
  @Output() onSelectProcessEvent = new EventEmitter<Vaccant>();

  items: ProcessApp[] = [];
  loading = false;

  // catalogs
  types: Catalog[] = [];
  states: Catalog[] = [];

  constructor(private readonly _processApi: ProcessApiService,
    private readonly _vaccantApi: VaccantApiService,
    private readonly _catalogAPi: CatalogApiService,
    private spinner: NgxSpinnerService,
    private toast: CustomToastService) {}

  ngOnInit(): void {

    this.loading = true;
    this.loadCatalogs().pipe(
      tap((catalogs: [Catalog[], Catalog[]]) => {
        this.types = catalogs[0];
        this.states = catalogs[1];
      }),
      mergeMap((reps: any) => this._processApi.findAllByVaccantIsNullAndIdAccount(this.idAccount))
    )
    .subscribe((resp: ResponseApi) => {
      this.items = resp.result;
      if (this.items.length === 0) {
        this.toast.addPrimeToast('info', '', 'No existen procesos disponibles. Intente crear una nuevo proceso.');
      }
      this.loading = false;
    }, err => {
      this.loading = false;
    });
  }
  loadCatalogs(): Observable<any> {
    const getTypes$ = this._catalogAPi.findAllByType(CATALOG_PROJECT_TYPE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const getStates$ = this._catalogAPi.findAllByType(CATALOG_PROCESS_STATE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getTypes$, getStates$);
  }
  getProcessTypeLabel(code: number) {
    return this.types.find(i => i.code === code)?.label ?? 'NE';
  }
  getProcessStateLabel(code: number) {
    return this.states.find(i => i.code === code)?.label ?? 'NE';
  }
  getProcessStateValue(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'NE';
  }
  onSelectProcess(item: ProcessApp) {
    this.spinner.show("save");
    const update$ = this._vaccantApi.updateIdProcessInVaccant(this.idVaccant, item.id);
    update$.subscribe((resp: ResponseApi) => {
      this.spinner.hide("save");
      this.toast.addPrimeToast('success', '', resp.message);
      this.onSelectProcessEvent.emit(resp.result);
    }, err => {
      console.log(err);
      this.toast.addPrimeToast('error', '', err.error.message);
      this.spinner.hide("save");
    });
    
  }
 

}