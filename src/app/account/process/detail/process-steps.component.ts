import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Plan } from 'src/app/_models/Plan';
import { StorageService } from 'src/app/_services/security/storage.service';
import { STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED } from 'src/app/_utils/constants';

@Component({
  selector: 'app-process-create-steps',
  templateUrl: './process-steps.component.html',
  styleUrls: ['./process-steps.component.scss']
})
export class ProcessStepsComponent implements OnInit, OnDestroy {

  items: MenuItem[] = [];
  activeItem!: MenuItem;
  routeSubscription: Subscription = new Subscription();
  planSelected!: Plan;


  constructor(private router: Router,
    private _storage: StorageService) {
    this.planSelected = this._storage.getObject(STORAGE_LOCAL, STORAGE_PLAN_ACCOUNT_SELECTED);
  }

  ngOnInit(): void {

    this.items = [
      { label: 'Configuración', icon: 'pi pi-fw pi-cog', routerLink: '/account/process/item/detail' },
      { label: 'Evaluaciones', icon: 'pi pi-fw pi-th-large', routerLink: '/account/process/item/evaluations' },
      { label: 'Participantes', icon: 'pi pi-fw pi-users', routerLink: '/account/process/item/requests' },
      { label: 'Resumen y envío', icon: 'pi pi-fw pi-send', routerLink: '/account/process/item/resume', }
    ];

    if (this.planSelected.isPostVacancyActive) {
      this.items = [
        { label: 'Configuración', icon: 'pi pi-fw pi-cog', routerLink: '/account/process/item/detail' },
        { label: 'Evaluaciones', icon: 'pi pi-fw pi-th-large', routerLink: '/account/process/item/evaluations' },
        { label: 'Participantes', icon: 'pi pi-fw pi-users', routerLink: '/account/process/item/requests' },
        { label: 'Vacante', icon: 'pi pi-fw pi-users', routerLink: '/account/process/item/vaccant' },
        { label: 'Resumen y envío', icon: 'pi pi-fw pi-send', routerLink: '/account/process/item/resume', }
      ];
    }

    this.activeItem = this.items.find(item => item.routerLink === this.router.url) ?? this.items[0];

    const gerRouteEvents$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    )
      .subscribe((event: any) => {
        if (event.urlAfterRedirects !== undefined) {
          this.activeItem = this.items.find(item => item.routerLink === event.urlAfterRedirects) ?? this.items[0];
        }
      });
    this.routeSubscription.add(gerRouteEvents$);
  }
  ngOnDestroy(): void {
    this.routeSubscription.unsubscribe();
  }

}
