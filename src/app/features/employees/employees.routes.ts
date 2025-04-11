import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./employee-list/employee-list.component').then(m => m.EmployeeListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'org-chart',
    loadComponent: () => import('./org-chart/org-chart.component').then(m => m.OrgChartComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'contracts/:id',
        loadChildren: () => import('../contracts/contracts.routes').then(m => m.CONTRACT_ROUTES),
      },
      {
        path: 'documents/:id',
        loadChildren: () => import('../documents/documents.routes').then(m => m.DOCUMENT_ROUTES),
      }
    ]
  }
];
