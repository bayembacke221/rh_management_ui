import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./reports-dashboard/reports-dashboard.component').then(m => m.ReportsDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'turnover',
    loadComponent: () => import('./turnover-report/turnover-report.component').then(m => m.TurnoverReportComponent),
    canActivate: [authGuard]
  },
  {
    path: 'absenteeism',
    loadComponent: () => import('./absenteeism-report/absenteeism-report.component').then(m => m.AbsenteeismReportComponent),
    canActivate: [authGuard]
  },
  {
    path: 'salary',
    loadComponent: () => import('./salary-report/salary-report.component').then(m => m.SalaryReportComponent),
    canActivate: [authGuard]
  },
  {
    path: 'distribution',
    loadComponent: () => import('./distribution-report/distribution-report.component').then(m => m.DistributionReportComponent),
    canActivate: [authGuard]
  }
];
