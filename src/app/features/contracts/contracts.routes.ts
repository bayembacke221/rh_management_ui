import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';


export const CONTRACT_ROUTES: Routes = [
  {
    path: '',
    redirectTo:'add',
    pathMatch: 'full'
  },
  {
    path: 'add',
    loadComponent: () => import('./employee-contracts/employee-contracts/employee-contracts.component').then(m => m.EmployeeContractsComponent),
    canActivate: [authGuard]
  }
];
