import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token.service';
import {AuthenticationResponse} from './models/authentication-response';
import {AuthenticationService} from './services/authentication.service';
import {UserDto} from './models/user-dto';
import {AuthenticationRequest} from './models/authentication-request';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private authenticationService: AuthenticationService,
    private tokenService: TokenService,
    private router: Router
  ) { }

  login(username: string, password: string): Observable<AuthenticationResponse> {

    let param: AuthenticationRequest =  {
      email: username,
      password: password
    }
    return this.authenticationService.authenticate({ body: param })
      .pipe(
        tap(response => {
          this.tokenService.saveToken(response.token!);
          if (response.email) {
            this.tokenService.saveUser(response.email);
          }
        })
      );
  }

  logout(): Observable<void> {
    let authHeader = this.tokenService.getToken();
    return this.authenticationService.logout({
      Authorization: `Bearer ${authHeader}`
    })
      .pipe(
        tap(() => {
          this.tokenService.clearStorage();
          this.router.navigate(['/login']);
        })
      );
  }

  getCurrentUser(): Observable<UserDto> {
    return this.authenticationService.getCurrentUser();
  }

  isAuthenticated(): boolean {
    return this.tokenService.isAuthenticated();
  }

  getUser(): any {
    return this.tokenService.getUser();
  }
}
