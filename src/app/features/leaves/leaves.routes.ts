import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const LEAVES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./leave-list/leave-list.component').then(m => m.LeaveListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'calendar',
    loadComponent: () => import('./leave-calendar/leave-calendar.component').then(m => m.LeaveCalendarComponent),
    canActivate: [authGuard]
  },
  {
    path: 'create',
    loadComponent: () => import('./leave-form/leave-form.component').then(m => m.LeaveFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./leave-form/leave-form.component').then(m => m.LeaveFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'view/:id',
    loadComponent: () => import('./leave-details/leave-details.component').then(m => m.LeaveDetailsComponent),
    canActivate: [authGuard]
  }
];
