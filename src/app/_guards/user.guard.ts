import { Injectable } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Authority } from '../_models/Authority';
import { AuthenticationService } from '../_services/security/authentication.service';
import { ROLE_ACCESS_ADMIN, ROLE_ACCESS_CORP, ROLE_ACCESS_USER } from '../_utils/constants';

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivateChild {
  constructor(private readonly _auth: AuthenticationService, private router: Router) {}
  canActivateChild(
    childRoute: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const role: Authority = this._auth.getAccessRole()!;
      if (role && (role.authority === ROLE_ACCESS_USER || role.authority === ROLE_ACCESS_ADMIN)) {
        return true;
      } else {
        console.log('g1');
        this.router.navigate(['/authentication']);
        return false;
      }
  }
  
}