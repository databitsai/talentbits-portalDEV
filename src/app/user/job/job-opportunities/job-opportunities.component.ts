import { Component, OnInit } from '@angular/core';
import { iif, Observable, of, throwError, zip } from 'rxjs';
import { mergeMap, tap } from 'rxjs/operators';
import { Catalog } from 'src/app/_models/Catalog';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { Vaccant } from 'src/app/_models/Vaccant';
import { CatalogApiService } from 'src/app/_services/api/catalog-api.service';
import { VaccantApiService } from 'src/app/_services/api/vaccant-api.service';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { CATALOG_MOBILITY, CATALOG_VACCANT_STATE, CATALOG_WORKING_DAY, STORAGE_SESSION, VACANT_SELECTED_USER } from 'src/app/_utils/constants';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { StorageService } from 'src/app/_services/security/storage.service';

interface PageResult {
  currentPage: number;
  items: any[];
  totalItems: number;
  totalPages: number;
}

@Component({
  selector: 'app-job-opportunities',
  templateUrl: './job-opportunities.component.html',
  styleUrls: ['./job-opportunities.component.scss']
})
export class JobOpportunitiesComponent implements OnInit {

  //Catalogos
  statusVaccant: Catalog[] = [];
  workingDay: Catalog[] = [];
  mobility: Catalog[] = [];

  item!: Vaccant;
  rows = 6;
  page = 0;
  pageResult!: PageResult;
  loading = false;
  suggestions: string[] = ["hello"];

  // filters
  searchName = '';
  filterNameSelected: any = null;
  validFromFilters: any[] = [
    {
      label: 'Mas recientes',
      value: true
    },
    {
      label: 'Mas antiguos',
      value: false
    }
  ];
  sortValidFromDesc = true;
  yearsExperienceFilters: any[] = [
    {
      label: '0',
      value: 0
    },
    {
      label: '1',
      value: 1
    },
    {
      label: '2',
      value: 2
    },
    {
      label: 'más de 3',
      value: 3
    }
  ];
  yearsExperienceSelected = null;
  workingDaySelectedCodes: number[] = [];
  mobilitySelectedCodes: number[] = [];


  constructor(
    private toast: CustomToastService,
    private readonly _catalogVaccant: VaccantApiService,
    private readonly _catalogAPi: CatalogApiService,
    private router: Router,
    private _storage: StorageService
  ) { }

  ngOnInit(): void {
    this._storage.deleteKey(STORAGE_SESSION, VACANT_SELECTED_USER);
    this.loading = true;
    this.loadCatalogs()
      .pipe(
        tap((catalogs: any[]) => {
           this.statusVaccant = catalogs[0];
           this.workingDay = catalogs[1];
           this.mobility = catalogs[2];
        }),
        mergeMap((resp: any[]) => {
          const request: any = {
            search: null,
            sortValidFromDesc: true,
            yearsExperience:  null,
            workingDayCodes: this.workingDaySelectedCodes.length === 0 ? this.workingDay.map(i => i.code) : this.workingDaySelectedCodes,
            mobilityCodes: this.mobilitySelectedCodes.length === 0 ? this.mobility.map(i => i.code) : this.mobilitySelectedCodes
          };
          return  this._catalogVaccant.findAllVaccant(request, this.page, this.rows)
          .pipe(
            mergeMap((response: ResponseApi) =>
              iif(() => response.status === 'OK',
                of(response.result),
                throwError(response.message)
              )
            )
          );
        })
      )
      .subscribe((response: PageResult) => {
        response.items = [
          ...this.calculateTimeDifference(response.items)
        ];
        this.pageResult = response;
        this.loading = false;
        }, (err) => {
          this.toast.addPrimeToast('error', '', err.error.message);
          this.loading = false;
        }
      );
  }

  loadCatalogs(): Observable<any> {
    const vaccantStateCatalog$ = this._catalogAPi.findAllByType(CATALOG_VACCANT_STATE).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const workingDayCatalog$ = this._catalogAPi.findAllByType(CATALOG_WORKING_DAY).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    const mobilityCatalog$ = this._catalogAPi.findAllByType(CATALOG_MOBILITY).pipe(
      mergeMap((response: ResponseApi) => iif(() => response.status === 'OK', of(response.result), throwError(response.message)))
    );
    return zip(vaccantStateCatalog$, workingDayCatalog$, mobilityCatalog$);
  }
  loadData(page: number, size: number): void {
    this.loading = true;
    const request: any = {
      search: this.filterNameSelected,
      sortValidFromDesc: this.sortValidFromDesc,
      yearsExperience:  this.yearsExperienceSelected,
      workingDayCodes: this.workingDaySelectedCodes.length === 0 ? this.workingDay.map(i => i.code) : this.workingDaySelectedCodes,
      mobilityCodes: this.mobilitySelectedCodes.length === 0 ? this.mobility.map(i => i.code) : this.mobilitySelectedCodes
    };
    this._catalogVaccant.findAllVaccant(request, this.page, this.rows)
    .pipe(
      mergeMap((response: ResponseApi) =>
        iif(() => response.status === 'OK',
          of(response.result),
          throwError(response.message)
        )
      )
    ).subscribe((response: PageResult) => {
      response.items = [
        ...this.calculateTimeDifference(response.items)
      ];
      this.pageResult = {
        ...response
      };
      this.loading = false;
    }, err => {
      this.loading = false;
    });
  }
  paginate(event: any) {
    this.loading = true;
    this.page = event.page;
    this.rows = event.rows;
    this.pageResult.items = [];
    this.loadData(this.page, this.rows);
  }
  calculateTimeDifference(items: any[]): any[]{
    items = items.map(item => {
      if (item.validFrom) {
        const now: Date = new Date();
        const validFrom: Date = new Date(item.validFrom);

        var a = moment(now);
        var b = moment(validFrom);

        let differenceTime = a.diff(b, 'days');

        let timeDifference = '';
        if (differenceTime > 0) {
          timeDifference = 'Hace ' + (differenceTime) + (differenceTime === 1 ? ' día' : ' días');
        } else {
          differenceTime = a.diff(b, 'hours');
          
          if (differenceTime > 0) {
            timeDifference = 'Hace ' + (differenceTime) + (differenceTime === 1 ? ' hora' : ' horas');
          } else {
            differenceTime = a.diff(b, 'minutes');
            timeDifference = 'Hace ' + (differenceTime) + (differenceTime === 1 ? ' minuto' : ' minutos');
          }
        }

        item.timeDifference = timeDifference;
      }
      return item;
    });
    return items;
  }
  searchAutoComplete(event: any) {
    this.suggestions = ["Data Scientist", "Data Engineer", "Data Analyst", "Data Quality Analyst", "Data Steward"];
  }
  onSearch() {
    this.filterNameSelected = this.searchName;
    this.loadData(this.page, this.rows);
  }
  onSelectVaccant(item: any) {
    this._storage.createObject(STORAGE_SESSION, VACANT_SELECTED_USER, item);
    this.router.navigate(['/user/job/selected']);
  }
  onClean() {
    this.filterNameSelected = null;
    this.searchName = '';
    this.sortValidFromDesc = true;
    this.yearsExperienceSelected = null;
    this.workingDaySelectedCodes = [];
    this.mobilitySelectedCodes = [];
    this.loadData(this.page, this.rows);
  }

}
