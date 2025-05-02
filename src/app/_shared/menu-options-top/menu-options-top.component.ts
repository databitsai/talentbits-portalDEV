import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Authority } from 'src/app/_models/Authority';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { AuthenticationService } from 'src/app/_services/security/authentication.service';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ROLE_ACCESS_ADMIN, ROLE_ACCESS_CORP, ROLE_ACCESS_USER, STORAGE_LOCAL, TOKEN_INFO_ACCESS } from 'src/app/_utils/constants';

@Component({
  selector: 'app-menu-options-top',
  templateUrl: './menu-options-top.component.html',
  styleUrls: ['./menu-options-top.component.scss']
})
export class MenuAccountSelectorsComponent implements OnInit {
  actions: MenuItem[] = [];
  selectors: MenuItem[] = [];
  authorities: Authority[] = [];
  constructor(private readonly _auth: AuthenticationService,
    private _router: Router,
    private toast: CustomToastService,
    private translateService: TranslateService,
    private readonly _storage: StorageService) {
    this.authorities = this._storage.getObject(STORAGE_LOCAL, TOKEN_INFO_ACCESS);
  }

  ngOnInit(): void {
    this.actions = [
      {
        label: 'Cerrar sesión',
        icon: 'pi pi-power-off',
        command: () => this.logout(),
      },
    ];
  }
  logout() {
    this._auth.logout();
    this._router.navigate(['/authentication']);
    this.toast.addPrimeToast('success', '', this.translateService.instant('t.succeesLogout'));
  }
  openRoute(path: string) {
    this._router.navigate([path]);
  }

}
