import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const CONTRACT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./contract-list/contract-list.component').then(m => m.ContractListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./contract-form/contract-form.component').then(m => m.ContractFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./contract-form/contract-form.component').then(m => m.ContractFormComponent),
    canActivate: [authGuard]
  },
  {
    path: ':id',
    loadComponent: () => import('./contract-detail/contract-detail.component').then(m => m.ContractDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'employee/:employeeId',
    loadComponent: () => import('./employee-contracts/employee-contracts/employee-contracts.component').then(m => m.EmployeeContractsComponent),
    canActivate: [authGuard]
  }
];
