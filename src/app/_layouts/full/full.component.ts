import { MediaMatcher } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { CustomToastService } from 'src/app/_services/common/custom-toast.service';
import { AuthenticationService } from 'src/app/_services/security/authentication.service';

@Component({
  selector: 'app-full',
  templateUrl: './full.component.html',
  styleUrls: ['./full.component.scss']
})
export class FullComponent implements OnInit, OnDestroy {
  year = new Date().getFullYear();
  // sidenave responsive
  mobileQuery!: MediaQueryList;
  private _mobileQueryListener!: () => void;
  displaySidemenu = false;
  isSidenavOpen = true;
  constructor(private readonly _auth: AuthenticationService,
    private _router: Router,
    private translateService: TranslateService,
    private toast: CustomToastService,
    changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addEventListener('mobile', this._mobileQueryListener);
    if (this.mobileQuery.matches) {
      this.isSidenavOpen = false;
    }
  }
  ngOnDestroy(): void {
    this.mobileQuery.removeEventListener('mobile', this._mobileQueryListener);
  }

  ngOnInit(): void {
  }
  openedSideNav(e: any) {
    this.isSidenavOpen = e;
  }

}
