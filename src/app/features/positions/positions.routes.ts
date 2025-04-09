import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const POSITION_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./position-list/position-list.component').then(m => m.PositionListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./position-form/position-form.component').then(m => m.PositionFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./position-form/position-form.component').then(m => m.PositionFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./position-detail/position-detail.component').then(m => m.PositionDetailComponent),
    canActivate: [authGuard]
  }
];
