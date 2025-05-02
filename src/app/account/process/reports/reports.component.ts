import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent implements OnInit, OnDestroy {

  items: MenuItem[] = [];
  activeItem!: MenuItem;
  routeSubscription: Subscription = new Subscription();

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.items = [
      { label: 'Equipo', icon: 'pi pi-fw pi-chart-bar', routerLink: '/account/process/reports/team' },
      { label: 'Participantes', icon: 'pi pi-fw pi-chart-bar', routerLink: '/account/process/reports/participants' }
    ];

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
