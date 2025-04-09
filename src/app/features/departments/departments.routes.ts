import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const DEPARTMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./department-list/department-list.component').then(m => m.DepartmentListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./department-form/department-form.component').then(m => m.DepartmentFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./department-form/department-form.component').then(m => m.DepartmentFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./department-detail/department-detail.component').then(m => m.DepartmentDetailComponent),
    canActivate: [authGuard]
  }
];
