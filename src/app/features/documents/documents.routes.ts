import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const DOCUMENT_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'add',
    pathMatch: 'full'
  },
  {
    path: 'add',
    loadComponent: () => import('./employee-documents/employee-documents.component').then(m => m.EmployeeDocumentsComponent),
    canActivate: [authGuard]
  }

];
