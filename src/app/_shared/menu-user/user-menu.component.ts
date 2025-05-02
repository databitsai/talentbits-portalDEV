import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AccountResume } from 'src/app/_models/Account';
import { Authority } from 'src/app/_models/Authority';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, CATALOG_ACCOUNT_IND, ROLE_ACCESS_ADMIN, ROLE_ACCESS_USER, STORAGE_LOCAL, TOKEN_INFO_ACCESS } from 'src/app/_utils/constants';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {
  items: MenuItem[] = [];
  accountSelected: AccountResume = Object.create({});
  authorities: Authority[] = [];
  show = false;
  constructor(private _storage: StorageService) {
    this.accountSelected= this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE);
    this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
  }

  ngOnInit(): void {
    if (this.accountSelected) {
      this.show = this.authorities.some(i => i.authority === ROLE_ACCESS_USER || i.authority === ROLE_ACCESS_ADMIN) && this.accountSelected.type === CATALOG_ACCOUNT_IND;
    }
    this.items = [
      {
        label: 'Mis procesos',
        icon: 'pi pi-pw pi-th-large',
        routerLink: '/user/process/main',
      },
      {
        label: 'Bolsa de trabajo',
        icon: 'pi pi-pw pi-id-card',
        routerLink: '/user/job',
      },
      {
        label: 'Configuración',
        icon: 'pi pi-pw pi-cog',
        expanded: true,
        items: [
          {
            label: 'Mi perfil',
            icon: 'pi pi-pw pi-user',
            routerLink: '/user/config/profile',
          }
        ]
      }
    ];
    this._storage.changes.subscribe(({key, value}) => {
      if (key === ACCOUNT_SELECTED_ROUTE) {
        this.show = false;
        if (value) {
          this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
          this.accountSelected = value;
          this.show = this.authorities.some(i => i.authority === ROLE_ACCESS_USER || i.authority === ROLE_ACCESS_ADMIN) && this.accountSelected.type === CATALOG_ACCOUNT_IND;
        }
      }
    });
  }

}
