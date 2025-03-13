import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import {TokenService} from '../../services/token.service';

export const authGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isAuthenticated()) {
    return true;
  }

  // Rediger vers la page de connexion avec le chemin actuel comme paramètre de requête
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const loginGuard: CanActivateFn = (route, state) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  if (tokenService.isAuthenticated()) {
    // Si l'utilisateur est déjà connecté, redirigez-le vers le tableau de bord
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
