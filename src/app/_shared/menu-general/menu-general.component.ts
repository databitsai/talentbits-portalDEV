import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-menu-general',
  templateUrl: './menu-general.component.html',
  styleUrls: ['./menu-general.component.scss']
})
export class MenuGeneralComponent implements OnInit {

  items: MenuItem[] = [];

  constructor() { }

  ngOnInit(): void {
    this.items = [
      {
        label: 'Otras opciones',
        icon: 'pi pi-pw pi-cog',
        expanded: true,
        items: [
          {
            label: 'Mis cuentas',
            icon: 'pi pi-pw pi-search',
            routerLink: '/user-accounts',
          }
        ]
      }
    ];
  }

}
