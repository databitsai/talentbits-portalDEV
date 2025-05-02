import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Authority } from 'src/app/_models/Authority';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, ROLE_ACCESS_ADMIN, STORAGE_LOCAL, TOKEN_INFO_ACCESS, TOKEN_INFO_LABEL } from 'src/app/_utils/constants';

@Component({
  selector: 'app-admin-menu',
  templateUrl: './admin-menu.component.html',
  styleUrls: ['./admin-menu.component.scss']
})
export class AdminMenuComponent implements OnInit {
  items: MenuItem[] = [];
  authorities: Authority[] = [];
  show = false;
  constructor(private readonly _storage: StorageService) {
    this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
  }

  ngOnInit(): void {
    this.show = this.authorities.some(i => i.authority === ROLE_ACCESS_ADMIN);
    this.items = [
      {
        label: 'Cuentas',
        icon: 'pi pi-pw pi-cog',
        style: {

        },
        items: [
          { label: 'Empresariales', icon: 'pi pi-fw pi-users', routerLink: '/admin/accounts/corporative' },
          { label: 'Administración', icon: 'pi pi-fw pi-users', routerLink: '/admin/accounts/administrator' },
        ]
      },
      {
        label: 'Evaluaciones',
        icon: 'pi pi-fw pi-external-link',
        items: [
          { label: 'Lista de evaluaciones', icon: 'pi pi-fw pi-list',routerLink: "/admin/evaluations" },
        ]
      }
    ];
    this._storage.changes.subscribe(({key, value}) => {
      if (key === ACCOUNT_SELECTED_ROUTE) {
        this.show = false;
        this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
        this.show = this.authorities.some(i => i.authority === ROLE_ACCESS_ADMIN);
      }
    });
  }

}
