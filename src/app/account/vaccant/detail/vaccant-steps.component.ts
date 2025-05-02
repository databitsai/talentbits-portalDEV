import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-vaccant-create-steps',
  templateUrl: './vaccant-steps.component.html',
  styleUrls: ['./vaccant-steps.component.scss']
})
export class VaccantStepComponent implements OnInit {

  items: MenuItem[] = [];
  activeItem!: MenuItem;

  constructor() { }

  ngOnInit(): void {
    this.items = [
      { label: 'Vacante', icon: 'pi pi-fw pi-users', routerLink: '/account/vaccant/item/detail' },
      { label: 'Resumen', icon: 'pi pi-fw pi-send',  routerLink: '/account/vaccant/item/resume', }
    ];
    this.activeItem = this.items[0];
  }

}
