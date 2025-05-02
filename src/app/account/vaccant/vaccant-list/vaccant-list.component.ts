import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgxSpinnerService } from 'ngx-spinner';
import { ConfirmationService } from 'primeng/api';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { AccountResume } from 'src/app/_models/Account';
import { Catalog } from 'src/app/_models/Catalog';
import { ProcessApp } from 'src/app/_models/ProcessApp';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { Vaccant } from 'src/app/_models/Vaccant';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { VaccantApiService } from 'src/app/_services/api/vaccant-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_VACCANT_STATE, PROCESS_SELECTED_ROUTE, STORAGE_LOCAL, VACANT_SELECTED_ROUTE } from 'src/app/_utils/constants';

@Component({
  selector: 'app-vaccant-list',
  templateUrl: './vaccant-list.component.html',
  styleUrls: ['./vaccant-list.component.scss']
})
export class VaccantListComponent implements OnInit {

  // catalogs
   statusVaccant: Catalog[] = [];

   itemQuestionDialog!: boolean;
   items: Vaccant[] = [];
   item!: Vaccant;

   accountSelected: AccountResume = Object.create({});

   enabledProcess = true
   
  constructor(
    private toast: CustomToastService,
    private readonly _catalogAPi: CatalogApiService,
    private _vaccantApi: VaccantApiService,
    private _storage: StorageService,
    private router: Router,
    private confirmationService: ConfirmationService,
    private spinner: NgxSpinnerService
  ) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
  }

  ngOnInit(): void {
    this._storage.deleteKey(STORAGE_LOCAL, VACANT_SELECTED_ROUTE);
    this.spinner.show("load");
    this.loadCatalogs()
      .pipe(
        tap((catalogs: any[]) => {
           this.statusVaccant = catalogs[0];
        }),
        mergeMap((resp: any[]) =>
          this._vaccantApi.findByAccount(this.accountSelected.id).pipe(
            mergeMap((response: ResponseApi) =>iif(() => response.status === 'OK',of(response.result),throwError(response.message))))
        )
      )
      .subscribe(
        (list: Vaccant[]) => {
          this.items = list;
          this.spinner.hide("load");
        },
        (err) => {
          this.toast.addPrimeToast('error', '', err.error.message);
          this.spinner.hide("load");
        }
      );
  }

  loadCatalogs(): Observable<any> {
    const vaccantStateCatalog$ = this._catalogAPi.findAllByType(CATALOG_VACCANT_STATE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(vaccantStateCatalog$);
  }
  
  // Table CRUD
  deleteItem(item: Vaccant) {
    const id: any = item.id;
    this.confirmationService.confirm({
      message: '¿Estás seguro de que quiere eliminar la vacante "' + item.title + '"?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show("load");
        this._vaccantApi
          .delete(id)
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
              this.spinner.hide("load");
            },
            (err) => {
              console.log(err);
              this.toast.addPrimeToast('error', '', err.error.message);
              this.spinner.hide("load");
            }
          );
      },
    });
  }
  
  getStatusVaccant(code: number) {
    return this.statusVaccant.find(i => i.code === code)?.label ?? 'NE';
  }
  getProcessStateLabel(code: number) {
    return this.statusVaccant.find(i => i.code === code)?.label ?? 'NE';
  }
  
  getProcessStateValue(code: number) {
    return this.statusVaccant.find(i => i.code === code)?.value ?? 'NE';
  }
  openProcess(item: ProcessApp) {
    console.log(item);
    this._storage.createObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE, item);
    this.router.navigate(['/account/process/item/resume']);
  }

  openVaccantDetail(item: Vaccant) {
    this._storage.createObject(STORAGE_LOCAL, VACANT_SELECTED_ROUTE, item);
    this.router.navigate(['/account/vaccant/detail']);
  }
  openVaccantAplicants(item: Vaccant) {
    this._storage.createObject(STORAGE_LOCAL, VACANT_SELECTED_ROUTE, item);
    this.router.navigate(['/account/vaccant/list-applicant']);
  }

}