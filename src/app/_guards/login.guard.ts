import { Injectable } from '@angular/core';
import { CanActivateChild, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router, CanActivate } from '@angular/router';
import { Observable } from 'rxjs';
import { Authority } from '../_models/Authority';
import { Role } from '../_models/Role';
import { AuthenticationService } from '../_services/security/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  constructor(private readonly _auth: AuthenticationService, private router: Router) {}
  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
      const role: Authority = this._auth.getAccessRole()!;
      if (role) {
        return true;
      } else {
        console.log('g0');
        this.router.navigate(['/authentication']);
        return false;
      }
  }
  
}
