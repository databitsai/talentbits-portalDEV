import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpErrorResponse
} from '@angular/common/http';

import { Observable, of, throwError, timer } from 'rxjs';
import { catchError, mergeMap, retryWhen } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthenticationService } from './_services/security/authentication.service';
import { CustomToastService } from './_services/common/custom-toast.service';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {

    retryDelay = 250;
    retryMaxAttempts = 1;
    refreshTokenInProgress = false;
    constructor(private _auth: AuthenticationService, private router: Router, private toast: CustomToastService) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (request.url.includes('oauth/token')
        || request.url.includes('assets/')
        || request.url.includes('process-request/validate')
        || request.url.includes('catalog/')
        || request.url.includes('process-request/register')
        || request.url.includes('process-request/add')
        || request.url.includes('process-request/new')) {
            request = this.addNoAuthHeader(request);
            return next.handle(request);
        } else {

            // Handle request
            request = this.addAuthHeader(request);

            // Handle response
            return next.handle(request)
                .pipe(
                    this.handleResponseError(request, next),
                    this.retryAfterDelay(),
                );

        }
    }

    retryAfterDelay(): any {
        return retryWhen(errors => {
            return errors.pipe(
                mergeMap((err, count) => {
                    // throw error when we've retried ${retryMaxAttempts} number of times and still get an error
                    if (count === this.retryMaxAttempts) {
                        return throwError(err);
                    }
                    return of(err).pipe(
                        mergeMap(() => timer(this.retryDelay))
                    );
                })
            );
        });
    }
    handleResponseError(request: HttpRequest<any>, next: HttpHandler) {
        return catchError((error: HttpErrorResponse) => {
            if (request.url.includes('oauth/token')) {
                return next.handle(request);
            }
            if (error.status === 401) {
                return throwError(error);
            } else {
                if (error.status !== 403) {
                    return throwError(error);
                }
                const forbidenError: any = error.error;

                if ((forbidenError.error !== undefined || forbidenError.indexOf("TOKEN EXPIRED") < 0) && forbidenError.error === 'Forbidden') {
                    console.log(forbidenError.error);
                    this.router.navigate(['/authentication/login']);
                }
                
                if (forbidenError.indexOf("TOKEN EXPIRED") >= 0) {
                    if (!this.refreshTokenInProgress) {
                        this.refreshTokenInProgress = true;
                        this._auth.refreshToken().subscribe(resp => {}, err => {
                            console.log(err);
                            this._auth.logout();
                            this.router.navigate(['/authentication']);
                        }, () => this.refreshTokenInProgress = false);
                    }
                    request = this.addAuthHeader(request);
                    return next.handle(request);
                } else {
                    this.toast.addPrimeToast('error', '', 'Invalid permissions' ?? 403);
                    return throwError(error);
                }
            }
        })
    }
    addAuthHeader(request: HttpRequest<any>) {
        if (!request.headers.has('Accept')) {
            request = request.clone({
                setHeaders: {
                    "Accept": 'application/json'
                }
            });
        }
        if (!request.headers.has('Content-Type')) {
            request = request.clone({
                setHeaders: {
                    "Content-Type": 'application/json'
                }
            });
        }
        if (!request.headers.has('Accept-Language')) {
            request = request.clone({
                setHeaders: {
                    "Accept-Language": 'es-ES'
                }
            });
        }
        request = request.clone({
            setHeaders: {
                "Authorization": 'Bearer ' + this._auth.getTokenStored()
            }
        });
        return request.clone();
    }
    addNoAuthHeader(request: HttpRequest<any>) {
        if (!request.headers.has('Accept-Language')) {
            request = request.clone({
                setHeaders: {
                    "Accept-Language": 'es-ES'
                }
            });
        }
        return request.clone();
    }
}