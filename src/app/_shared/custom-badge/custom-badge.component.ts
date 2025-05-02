import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-custom-badge',
  templateUrl: './custom-badge.component.html',
  styleUrls: ['./custom-badge.component.scss']
})
export class CustomBadgeComponent implements OnInit {

  @Input() status!: string;
  @Input() label!: string;
  severity = '';

  constructor() { }

  ngOnInit(): void {
    switch(this.status) {
      case 'ready':
        this.severity = 'info';
        break;
      case 'running':
        this.severity = 'success';
        break;
      case 'finished':
        this.severity = 'danger';
        break;
      default:
        this.severity = 'default';
    }
  }

}
