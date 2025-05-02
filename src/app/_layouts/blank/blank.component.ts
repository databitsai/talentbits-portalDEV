import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { LOCALE_EN_COD, LOCALE_EN_NAME, LOCALE_ES_COD, LOCALE_ES_NAME } from 'src/app/_utils/constants';

@Component({
  selector: 'app-blank',
  templateUrl: './blank.component.html',
  styleUrls: ['./blank.component.scss']
})
export class BlankComponent implements OnInit {
  languages: MenuItem[] = [];
  localeSelectedName: string = LOCALE_ES_NAME;
  year = new Date().getFullYear();
  constructor(private translateService: TranslateService) { }

  ngOnInit(): void {
    this.languages = [
      {
        id: LOCALE_ES_COD,
        label: LOCALE_ES_NAME,
        command: () => this.changeLocale(LOCALE_ES_COD),
        style: {
          background: '#e9ecef'
        }
        //routerLink:"/demo"  <-- this can be moved inside the addNewUser function.
      },
      {
        id: LOCALE_EN_COD,
        label: LOCALE_EN_NAME,
        command: () => this.changeLocale(LOCALE_EN_COD),
        styleClass: 'inactive'
      }
    ];
  }
  changeLocale(e: any) {
    this.translateService.use(e);
    this.languages.forEach((i, index) => this.languages[index].style = {
      background: '#fff'
    });
    const itemSelected: MenuItem = this.languages.find(i => i.id === e)!;
    if (itemSelected !== undefined) {
      itemSelected.style = {
        background: '#e9ecef'
      };
      this.localeSelectedName = itemSelected.label!;
    }
    console.log(this.languages)
  }
  showLocales(e: any) {
    // this.languages.forEach((i, index) => this.languages[index].style = {});
  }

}
