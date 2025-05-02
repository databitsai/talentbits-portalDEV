import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AccountResume } from 'src/app/_models/Account';
import { Authority } from 'src/app/_models/Authority';
import { Plan } from 'src/app/_models/Plan';
import { ResponseApi } from 'src/app/_models/ResponseApi';
import { PlanApiService } from 'src/app/_services/api/plan-api.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_ACCOUNT_CORP, ROLE_ACCESS_ADMIN, ROLE_ACCESS_CORP, STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED, TOKEN_INFO_ACCESS } from 'src/app/_utils/constants';

@Component({
  selector: 'app-menu-corporative',
  templateUrl: './menu-corporative.component.html',
  styleUrls: ['./menu-corporative.component.scss']
})
export class MenuCorporativeComponent implements OnInit {

  items: MenuItem[] = [];
  accountSelected: AccountResume = Object.create({});
  authorities: Authority[] = [];
  show = false;
  plan!: Plan;

  constructor(private _storage: StorageService,
    private _planApi: PlanApiService) {
    this.accountSelected= this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
    this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
  }

  ngOnInit(): void {
    if (this.accountSelected) {
      this.show = this.authorities.some(i => i.authority === ROLE_ACCESS_CORP || i.authority === ROLE_ACCESS_ADMIN) && this.accountSelected.type === CATALOG_ACCOUNT_CORP;
    }
    this.items = [
      {
        label: 'Procesos',
        icon: 'pi pi-pw pi-th-large',
        routerLink: '/account/process',
      },
      {
        label: 'Vacantes',
        icon: 'pi pi-pw pi-users',
        routerLink: '/account/vaccant'
      },
      {
        label: 'Configuración',
        icon: 'pi pi-pw pi-cog',
        expanded: true,
        items: [
          {
            label: 'Usuarios y permisos',
            icon: 'pi pi-pw pi-users',
            routerLink: '/account/config/users',
          },
          {
            label: 'Mi empresa',
            icon: 'pi pi-pw pi-th-large',
            routerLink: '/account/config/plan',
          },
          {
            label: 'Mi perfil',
            icon: 'pi pi-pw pi-user',
            routerLink: '/account/config/profile',
          }
        ]
      }
    ];

    if (this.accountSelected !== null && this.show) {
      this.updatePlan();
    }

    this._storage.changes.subscribe(({key, value}) => {
      if (key === ACCOUNT_SELECTED_ROUTE) {
        this.show = false;
        if (value) {
          this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
          this.accountSelected = value;
          this.show = this.authorities.some(i => i.authority === ROLE_ACCESS_CORP || i.authority === ROLE_ACCESS_ADMIN) && this.accountSelected.type === CATALOG_ACCOUNT_CORP;
          if (this.accountSelected !== null && this.show) {
            this.updatePlan();
          }
        }
      }
      if (key === STORAGE_PLAN_ACCOUNT_SELECTED) {
        this.plan = this._storage.getObject(STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED);
        this.items = this.items.map(item => {
          if (this.plan !== null && item.label === 'Vacantes') {
            item.disabled = !this.plan.isPostVacancyActive;
          }
          return item;
        });
      }
    });
  }
  updatePlan() {
    this._planApi.findById(this.accountSelected.id)
    .subscribe((resp: ResponseApi) => {
      this._storage.createObject(STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED, resp.result);
      this.plan = resp.result;
      this.items = this.items.map(item => {
        if (item.label === 'Vacantes') {
          item.disabled = !this.plan.isPostVacancyActive;
        }
        return item;
      });
    });
  }

}
