import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
import { ACCOUNT_SELECTED_ROUTE, CATALOG_VACCANT_STATE, PROCESS_SELECTED_ROUTE, STORAGE_LOCAL } from 'src/app/_utils/constants';

@Component({
  selector: 'app-process-vaccant',
  templateUrl: './process-vaccant.component.html',
  styleUrls: ['./process-vaccant.component.scss']
})
export class ProcessVaccantComponent implements OnInit {

  items: any[] = [];
  openListVaccantDialog = false;
  processSelected: ProcessApp = Object.create({});
  vaccantSelected!: any;

  constructor(private router: Router,
    private readonly _storage: StorageService,
    private _vaccantApi: VaccantApiService,
    private spinner: NgxSpinnerService,
    private confirmationService: ConfirmationService,
    private toast: CustomToastService) {
    this.processSelected = this._storage.getObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
  }

  ngOnInit(): void {
    this.items = [
      {
        title: 'Crear nueva vacante',
        content: 'Cree una vacante para vincularla a este proceso. La vacante puede ser vinculada después.',
        action: 'Ir a creación de vacante',
        icon: 'post_add',
        do: () => {
          this.router.navigate(['/account/vaccant/main']);
        }
      }, 
      {
        title: 'Asignar/Cambiar vacante creada previamente',
        content: 'Si ya tiene creada una vacante, selecciónela y vincúlela a este proceso. La vacante puede ser vinculada después.',
        action: 'Seleccionar vacante',
        icon: 'work',
        do: () => {
          this.openListVaccantDialog = true;
        }
      },
      {
        title: 'Paso anterior',
        content: 'Regresar a la ventana de participantes.',
        action: 'Anterior',
        icon: 'navigate_before',
        do: () => {
          this.router.navigate(['/account/process/item/requests']);
        }
      },
      {
        title: 'Saltar este paso',
        content: 'Seguir el proceso sin vincular vacante.',
        action: 'Siguiente',
        icon: 'navigate_next',
        do: () => {
          this.router.navigate(['/account/process/item/resume']);
        }
      }
    ];
    this.spinner.show("load");
    this._vaccantApi.findVaccantByIdProcess(this.processSelected.id)
    .subscribe((resp: ResponseApi) => {
      this.vaccantSelected = resp.result;
      this.spinner.hide("load");
    });
  }
  onSelectVaccant(item: Vaccant) {
    this.vaccantSelected = item;
  }
  openSelectVaccant() {
    this.openListVaccantDialog = true;
  }
  onDeleteProcess() {
    this.confirmationService.confirm({
      message: '¿Estás seguro que quiere quitar la vacante "' + this.vaccantSelected.title + '" de esta proceso?',
      header: 'Confirmar',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.spinner.show("load");
        const update$ = this._vaccantApi.updateIdProcessInVaccant(this.vaccantSelected.id, null);
        update$.subscribe((resp: ResponseApi) => {
          this.spinner.hide("load");
          this.toast.addPrimeToast('success', '', resp.message);
          this.vaccantSelected = null;
        }, err => {
          console.log(err);
          this.toast.addPrimeToast('error', '', err.error.message);
          this.spinner.hide("load");
        });
      }
    });  
  }

}

@Component({
  selector: 'app-process-vaccant-list',
  templateUrl: './process-vaccant-list.component.html',
  styleUrls: ['./process-vaccant.component.scss']
})
export class ProcessVaccantListComponent implements OnInit {

  @Input() idProcess!: number;
  @Output() onSelectVacantEvent = new EventEmitter<Vaccant>();

  accountSelected: AccountResume = Object.create({});
  items: Vaccant[] = [];
  loading = false;

  // catalogs
   statusVaccant: Catalog[] = [];

  constructor(private _storage: StorageService,
    private _vaccantApi: VaccantApiService,
    private readonly _catalogAPi: CatalogApiService,
    private spinner: NgxSpinnerService,
    private toast: CustomToastService) {
    this.accountSelected = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
  }

  ngOnInit(): void {

    this.loading = true;
    this.loadCatalogs()
    .pipe(
      tap((catalogs: any[]) => {
         this.statusVaccant = catalogs[0];
      }),
      mergeMap((resp: any[]) =>
        this._vaccantApi.findByAccountWithoutProcess(this.accountSelected.id).pipe(
          mergeMap((response: ResponseApi) =>iif(() => response.status === 'OK',of(response.result),throwError(response.message))))
      )
    )
    .subscribe(
      (list: Vaccant[]) => {
        this.items = list;
        if (this.items.length === 0) {
          this.toast.addPrimeToast('info', '', 'No existen vacantes disponibles. Intente crear una nueva vacante.');
        }
        this.loading = false;
      },
      (err) => {
        console.log(err);
        this.loading = false;
      });
  }

  loadCatalogs(): Observable<any> {
    const vaccantStateCatalog$ = this._catalogAPi.findAllByType(CATALOG_VACCANT_STATE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(vaccantStateCatalog$);
  }
  getProcessStateLabel(code: number) {
    return this.statusVaccant.find(i => i.code === code)?.label ?? 'NE';
  }
  
  getProcessStateValue(code: number) {
    return this.statusVaccant.find(i => i.code === code)?.value ?? 'NE';
  }
  onSelectVaccant(item: Vaccant) {
    this.spinner.show("save");
    const update$ = this._vaccantApi.updateIdProcessInVaccant(item.id, this.idProcess)
    .pipe(
      tap((resp: ResponseApi) => {
        this.onSelectVacantEvent.emit(resp.result);
        this.toast.addPrimeToast('success', '', resp.message);
      }),
      mergeMap((resp: any) => this._vaccantApi.findByAccountWithoutProcess(this.accountSelected.id) )
    );
    update$.subscribe((resp: ResponseApi) => {
      this.items = [...resp.result];
      this.spinner.hide("save");
    }, err => {
      console.log(err);
      this.toast.addPrimeToast('error', '', err.error.message);
      this.spinner.hide("save");
    });
  }

}
