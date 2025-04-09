import { Routes } from '@angular/router';
import { authGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [loginGuard]
  },
  {
    path: '',
    loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'employees',
        loadChildren: () => import('./features/employees/employees.routes').then(r => r.EMPLOYEE_ROUTES)
      },
      {
        path: 'departments',
        loadChildren: () => import('./features/departments/departments.routes').then(r => r.DEPARTMENT_ROUTES)
      },
      {
        path: 'positions',
        loadChildren: () => import('./features/positions/positions.routes').then(r => r.POSITION_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
