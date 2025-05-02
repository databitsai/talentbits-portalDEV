import { Component, Input, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute, Data } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { filter, map, mergeMap } from 'rxjs/operators';
import { StorageService } from 'src/app/_services/security/storage.service';
import { ACCOUNT_SELECTED_ROUTE, PROCESS_SELECTED_ROUTE, REPLACE_STRING_ACCOUNT_NAME, REPLACE_STRING_PROCESS_NAME, STORAGE_LOCAL } from 'src/app/_utils/constants';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  @Input() display = false;

  pageInfo: Data = Object.create(null);
  breads: MenuItem[] = [];
  home!: MenuItem;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private titleService: Title,
    private readonly _storage: StorageService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .pipe(map(() => this.activatedRoute))
      .pipe(
        map(route => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        })
      )
      .pipe(filter(route => route.outlet === 'primary'))
      .pipe(mergeMap(route => route.data))
      .subscribe(event => {
        this.titleService.setTitle(event['title']);
        this.pageInfo = event;
        if (this.pageInfo.urls !== undefined) {
          this.breads = this.pageInfo.urls.filter((i: any, index: number) => index > 0).map((url: any) => {
            if (url.replace && url.replace === REPLACE_STRING_ACCOUNT_NAME) {
              let newLabelAccount = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE)?.account;
              url.label = newLabelAccount ?? url?.label;
            }
            if (url.replace && url.replace === REPLACE_STRING_PROCESS_NAME) {
              let processSelected = this._storage.getObject(STORAGE_LOCAL, PROCESS_SELECTED_ROUTE);
              if (processSelected !== null) {
                url.label = processSelected.name ?? url?.label;
              }
            }
            if (url.url !== undefined) {
              url.routerLink = url.url;
              delete url.url;
            }
            return url;
          });
          if (this.pageInfo.urls !== undefined && this.pageInfo.urls.length > 0) {
            this.home = {
              routerLink: this.pageInfo.urls[0].url,
              icon: 'pi pi-home'
            };
          }
        }
      });
  }
  ngOnInit() {
    this._storage.changes.subscribe(({key, value}) => {
      if (key === ACCOUNT_SELECTED_ROUTE) {
        this.breads = this.breads.map((url: any) => {
          if (url.replace && url.replace === REPLACE_STRING_ACCOUNT_NAME) {
            let newLabelAccount = this._storage.getObject(STORAGE_LOCAL, ACCOUNT_SELECTED_ROUTE)?.account;
            url.label = newLabelAccount ?? url?.label;
          }
          if (url.url !== undefined) {
            url.routerLink = url.url;
            delete url.url;
          }
          return url;
        });
      }
    });
  }

}
