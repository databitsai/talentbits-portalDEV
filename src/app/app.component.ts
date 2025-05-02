import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig } from 'primeng/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'talentbits-portal';
  constructor(private config: PrimeNGConfig, private translateService: TranslateService) { }
  ngOnInit() {
    this.translateService.addLangs(['en', 'es']);
    this.translateService.setDefaultLang('es');

    const browserLang = this.translateService.getBrowserLang();
    this.translateService.use(browserLang.match(/en|es/) ? browserLang : 'en');
  }

  translate(lang: string) {
    this.translateService.use(lang);
    this.translateService.get('primeng').subscribe(res => this.config.setTranslation(res));
  }
}
