import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { filter, mergeMap, tap } from 'rxjs/operators';
import { Authority } from 'src/app/_models/Authority';
import { Catalog } from 'src/app/_models/Catalog';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { ProcessRequest } from 'src/app/_models/ProcessRequest';
import { ProcessRequestResume } from 'src/app/_models/ProcessRequestResume';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { ProcessApiService } from 'src/app/_services/api/process-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { CATALOG_PROCESS_STATE, PATTERN_EMAIL, PROCESS_SELECTED_ROUTE, ROLE_ACCESS_ADMIN, STORAGE_LOCAL, TOKEN_INFO_ACCESS } from 'src/app/_utils/constants';
import * as XLSX from 'xlsx';
type AOA = any[][];

@Component({
  selector: 'app-process-requests',
  templateUrl: './process-requests.component.html',
  styleUrls: ['./process-requests.component.scss']
})
export class ProcessRequestsComponent implements OnInit {
  // catalogs
  states: Catalog[] = [];
  // variables
  processSelected: ProcessApp = Object.create({});
  uploadedFiles: any[] = [];
  inviteAll = false;
  // form
  createForm!: FormGroup;
  // table
  itemDialog!: boolean;
  itemsDialog!: boolean;
  items: ProcessRequestResume[] = [];
  item!: ProcessRequestResume;
  selectedItems: ProcessRequestResume[] = [];
  submitted: boolean = false;
  dataExcell: AOA = [];
  wopts: XLSX.WritingOptions = { bookType: 'xlsx', type: 'array' };
  fileName: string = 'talentbits_template_participantes.xlsx';

  // results
  showResultsDialog = false;
  idRequestSelected!: number;

  constructor(private confirmationService: ConfirmationService,
    private fb: FormBuilder,
    private readonly _storage: StorageService,
    private _processApi: ProcessApiService,
    private readonly _catalogAPi: CatalogApiService,
    private toast: CustomToastService,
    private spinner: NgxSpinnerService) {
    this.processSelected = this._storage.getObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
  }

  ngOnInit(): void {
    this.createForm = this.fb.group({
      id: [],
      idProcess: [this.processSelected.id],
      firstName: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      lastName: ['', Validators.compose([Validators.required, Validators.maxLength(150)])],
      email: ['', Validators.compose([Validators.required, Validators.pattern(PATTERN_EMAIL), Validators.maxLength(150)])]
    });
    this.spinner.show("load");
    this.loadCatalogs().pipe(
      tap((catalogs: [Catalog[]]) => {
        this.states = catalogs[0];
      }),
      mergeMap((reps: any) => this._processApi.findRequests(this.processSelected.id))
    )
      .subscribe((resp: ResponseApi) => {
        const requestList: ProcessRequestResume[] = resp.result;
        this.items = requestList;
        this.inviteAll = this.items.every(item => item.selected === true);
        this.spinner.hide("load");
      }, err => {
        this.spinner.hide("load");
      });
  }
  loadCatalogs(): Observable<any> {
    const getStates$ = this._catalogAPi.findAllByType(CATALOG_PROCESS_STATE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getStates$);
  }
  openNew() {
    this.item = Object.create({});
    this.submitted = false;
    this.itemDialog = true;
  }
  openImport() {
    this.itemsDialog = true;
  }

  editProduct(product: any) {
    this.spinner.show("load");
    this._processApi.findRequestById(product.id).pipe(
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp)))
    )
      .subscribe((resp: ProcessRequest) => {
        this.item = { ...product };
        this.itemDialog = true;
        this.submitted = true;
        this.createForm.get('id')?.setValue(resp.id);
        this.createForm.get('firstName')?.setValue(resp.firstName);
        this.createForm.get('lastName')?.setValue(resp.lastName);
        this.createForm.get('email')?.setValue(resp.email);
        this.createForm.get('idProcess')?.setValue(this.processSelected.id);
        this.spinner.hide("load");
      }, err => {
        console.log(err);
        this.spinner.hide("load");
      });
  }
  showResults(item: any) {
    this.idRequestSelected = item.id;
    this.showResultsDialog = true;
  }

  deleteProduct(product: any) {
    this.confirmationService.confirm({
      message: '¿Esta seguro de eliminar la invitación a "' + product.name + '"?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show("load");
        this._processApi.deleteRequestById(product.id)
          .subscribe((resp: ResponseApi) => {
            console.log(resp);
            this.items = this.items.filter(val => val.id !== product.id);
            this.item = Object.create({});
            this.toast.addPrimeToast('success', '', resp.message);
            this.spinner.hide("load");
          }, err => {
            console.log(err);
            this.toast.addPrimeToast('error', '', err.error.message);
            this.spinner.hide("load");
          });
      }
    });
  }
  deleteSelectedItems() {
    this.confirmationService.confirm({
      message: 'Se eliminarán ' + this.selectedItems.length + ' participantes. ¿Quiere continuar con esta acción?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        console.log();
      }
    });
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

  saveProduct() {
    if (this.createForm.valid) {
      this.saveItemOnDb(this.createForm.value, this.submitted);
    } else {
      this.validateAllFormFields(this.createForm);
    }
  }
  saveItemOnDb(item: any, submitted: boolean) {
    const save$ = this._processApi.createRequest(item);
    const update$ = this._processApi.updateRequest(item);

    const request$ = !submitted ? save$ : update$;
    this.spinner.show("save");
    request$.subscribe(
      (resp: ResponseApi) => {
        this.item = resp.result;
        this.hideDialog();
        if (!submitted) {
          this.items.push(this.item);
        } else {
          this.items[this.findIndexById(this.item.id)] = this.item;
        }
        this.items = [...this.items];
        this.item = Object.create({});
        this.toast.addPrimeToast('success', '', resp.message);
        this.spinner.hide("save");
      },
      (err) => {
        console.log(err);
        this.toast.addPrimeToast('error', '', err.error.message);
        this.spinner.hide("save");
      },
      () => { }
    );
  }
  resetAllForms() {
    this.createForm.reset();
    this.createForm.get('idProcess')?.setValue(this.processSelected.id);
  }

  findIndexById(id: number): number {
    let index = -1;
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].id === id) {
        index = i;
        break;
      }
    }
    return index;
  }

  createId(): string {
    let id = '';
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < 5; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
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
  getStateLabel(code: number) {
    return this.states.find(i => i.code === code)?.label ?? 'ND';
  }
  getStateValue(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'default';
  }
  onChangeSelected(id: number) {
    this._processApi.selectRequestById(id).subscribe((resp: ResponseApi) => {
    }, err => {
      console.log(err);
      this.toast.addPrimeToast('error', '', err.error.message);
    });
    this.inviteAll = this.items.every(item => item.selected === true);
  }
  onFileChange(evt: any, pupload: any) {
    try {
      /* wire up file reader */
      const target: DataTransfer = <DataTransfer>(evt.originalEvent.target);
      if (target.files.length !== 1) throw new Error('Cannot use multiple files');
      const reader: FileReader = new FileReader();
      reader.onload = (e: any) => {
        /* read workbook */
        const bstr: string = e.target.result;
        const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

        /* grab first sheet */
        const wsname: string = wb.SheetNames[0];
        const ws: XLSX.WorkSheet = wb.Sheets[wsname];

        /* save data */
        const checkHeaders: string[] = ["Nombre", "Apellido", "Email"];
        let rows: any[][] = <AOA>(XLSX.utils.sheet_to_json(ws, { header: 1 }));
        /* check empty*/
        if (rows.length < 1) {
          this.toast.addPrimeToast('error', '', "Archivo vacio");
          pupload.clear();
          return;
        }
        /* get header*/
        const headerRow: any[] = rows[0].map(i => `${i}`).map(head => head.toLowerCase());
        /** check headers required  */
        if (headerRow.filter(i => i === 'nombre').length !== 1) {
          this.toast.addPrimeToast('error', '', "La columna \"Nombre\" es requerida y debe ser única");
          pupload.clear();
          return;
        }
        if (headerRow.filter(i => i === 'apellido').length !== 1) {
          this.toast.addPrimeToast('error', '', "La columna \"Apellido\" es requerida y debe ser única");
          pupload.clear();
          return;
        }
        if (headerRow.filter(i => i === 'email').length !== 1) {
          this.toast.addPrimeToast('error', '', "La columna \"Email\" es requerida y debe ser única");
          pupload.clear();
          return;
        }
        /**Object keys to lowercase */
        this.dataExcell = <AOA>(XLSX.utils.sheet_to_json(ws, { header: 0 }));
        this.dataExcell = this.dataExcell.map(iObj => {
          var key, keys = Object.keys(iObj);
          var n = keys.length;
          var newobj = Object.create({})
          while (n--) {
            let keyN: any = keys[n];
            newobj[keyN.toLowerCase()] = iObj[keyN];
          }
          return newobj;
        });
        /**Validate emails */
        this.dataExcell = this.dataExcell.map((i: any) => {
          const emailRegex = /^([A-Za-z0-9_\-.])+@([A-Za-z0-9_\-.])+\.([A-Za-z]{2,4})$/;
          const nameRegex = /^[a-zA-Z ]+$/;
          i.errors = [
            { label: 't.errorEmail', value: !emailRegex.test(i.email) },
            { label: 't.validateFirstname', value: !nameRegex.test(i.nombre) },
            { label: 't.validateLastname', value: !nameRegex.test(i.apellido) },
            { label: 't.validateFirstnameMax', value: i.nombre?.length > 150 },
            { label: 't.validateLastnameMax', value: i.apellido?.length > 150 }
          ];
          return i;
        });
        pupload.clear();
      };
      reader.readAsBinaryString(target.files[0]);
    } catch (err) {
      console.log(err);
    }
  }
  onHideImport() {
    this.dataExcell = [];
  }
  sendFileRequests() {
    if (this.dataExcell.length === 0) {
      this.toast.addPrimeToast('info', '', "No existen datos");
      return;
    }
    const hasErrors = this.dataExcell.some((i: any) => {
      const errors: any[] = i.errors;
      return errors.some(err => err.value);
    });
    if (hasErrors) {
      this.toast.addPrimeToast('info', '', "Existen datos inválidos. Revise la columna Estado");
      return;
    }
    const list: any[] = this.dataExcell.map((i: any) => {
      return {
        firstName: i.nombre,
        lastName: i.apellido,
        email: i.email.trim()
      };
    });
    const sendAllRequest: any = {
      idProcess: this.processSelected.id,
      list
    };
    this.spinner.show("save");
    this._processApi.createRequestBulk(sendAllRequest).subscribe((resp: ResponseApi) => {
      this.items = resp.result.concat(this.items);
      this.items = [...this.items];
      this.spinner.hide("save");
      this.itemsDialog = false;
      this.dataExcell = [];
    }, err => {
      console.log(err);
      this.spinner.hide("save");
      this.toast.addPrimeToast('error', '', err.error.message);
      if (err.error.result !== undefined && err.error.result !== null && Array.isArray(err.error.result)) {
        const errorList: any[] = err.error.result;
        this.dataExcell = this.dataExcell.map((item: any) => {
          const errorItem = errorList.find(k => k.email === item.email);
          // item.status = errorItem !== undefined = errorItem.i
          item.errors = [
            {
              label: errorItem.errors,
              value: errorItem.errors
            }
          ];
          console.log(errorItem);
          return item;
        });
      }
    });
  }
  downloadTemplate() {
    const template: any[][] = [
      ["Nombre", "Apellido", "Email"],
      ["Jhon", "Doe", "jhondoe@test.com"],
      ["Jane", "Doe", "janedoe@test.com"]
    ];
    /* generate worksheet */
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(template);

    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Participantes');

    /* save to file */
    XLSX.writeFile(wb, this.fileName);
  }
  getShortLabel(input: string) {
    return input.substring(0, 15) + (input.length > 15 ? '...' : '');
  }
  inviteAllToogle() {
    const request: any = {
      idProcess: this.processSelected.id,
      selected: this.inviteAll
    };
    const auxItems = this.items.map(item => {
      item.selected = this.inviteAll
      return item;
    });
    this.items = [
      ...auxItems
    ];
    this._processApi.selectAllRequests(request).subscribe(() => { }, err => {
      console.log(err);
      this.toast.addPrimeToast('error', '', err.error.message);
    });
  }

}

@Component({
  selector: 'app-process-requests-evaluations',
  templateUrl: './process-requests-evaluations.component.html',
  styleUrls: ['./process-requests.component.scss']
})
export class ProcessRequestsEvaluationsComponent implements OnInit {

  @Input() idRequest!: number;

  processSelected: ProcessApp = Object.create({});
  items: any[] = [];
  showState = false;
  loading = false;
  evaluationSelected: any = null;
  shoewEvaluationResult = false;
  authorities: Authority[] = [];
  // catalogs
  states: Catalog[] = [];

  constructor(private _processApi: ProcessApiService,
    private readonly _storage: StorageService,
    private readonly _catalogAPi: CatalogApiService) {
    this.processSelected = this._storage.getObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
    this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
  }

  ngOnInit(): void {

    this.loading = true;

    this.loadCatalogs().pipe(
      tap((resp: [Catalog[], Catalog[]]) => {
        this.states = resp[0];
      }),
      mergeMap((resp: any) => of(this.processSelected)),
      filter((process: ProcessApp) => process !== null),
      mergeMap((process: ProcessApp) => this._processApi.fetchEvaluationsQuestionsByProcess(process.id, this.idRequest)),
      mergeMap((resp: ResponseApi) => iif(() => resp.status === 'OK', of(resp.result), throwError(resp))),
    ).subscribe((resp: any) => {
      this.items = resp;
      this.showState = true;
      this.loading = false;
    });
  }
  loadCatalogs(): Observable<any> {
    const getStates$ = this._catalogAPi.findAllByType(CATALOG_PROCESS_STATE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(getStates$);
  }
  sumAproximateTime(questions: any[]) {
    // aproximateTime
    const seconds = questions.length > 0 ? questions.map((i: any) => i.aproximateTime).reduce((acc, item) => acc + item) : 0;
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      return `${(seconds / 60).toFixed(1)}min`;
    }
  }
  onEvaluationSelected(event: any) {
    console.log(event);
    this.evaluationSelected = event;
    this.shoewEvaluationResult = true;
  }
  onCloseResults() {
    this.evaluationSelected = null;
    this.shoewEvaluationResult = false;
  }
  getStateLabel(code: number) {
    return this.states.find(i => i.code === code)?.label ?? 'En espera';
  }
  getStateValue(code: number) {
    return this.states.find(i => i.code === code)?.value ?? 'default';
  }
  get isAdmin() {
    return this.authorities.some(i => i.authority === ROLE_ACCESS_ADMIN);
  }

}