import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {AuthService} from '../../../services/auth-wrapper-service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: NavItem[];
  expanded?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent {
  @Input() isOpen = true;

  navItems: NavItem[] = [
    {
      label: 'Tableau de bord',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      route: '/dashboard'
    },
    {
      label: 'Employés',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      route: '/employees',
      children: [
        { label: 'Liste des employés', icon: '', route: '/employees/list' },
        { label: 'Ajouter un employé', icon: '', route: '/employees/create' },
        { label: 'Organigramme', icon: '', route: '/employees/org-chart' }
      ]
    },
    {
      label: 'Départements',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      route: '/departments',
      children: [
        { label: 'Liste des départements', icon: '', route: '/departments/list' },
        { label: 'Ajouter un département', icon: '', route: '/departments/create' }
      ]
    },
    {
      label: 'Postes',
      icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      route: '/positions',
      children: [
        { label: 'Liste des postes', icon: '', route: '/positions/list' },
        { label: 'Ajouter un poste', icon: '', route: '/positions/create' }
      ]
    },
    {
      label: 'Congés',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      route: '/leaves',
      children: [
        { label: 'Liste des demandes', icon: '', route: '/leaves' },
        { label: 'Calendrier', icon: '', route: '/leaves/calendar' },
        { label: 'Nouvelle demande', icon: '', route: '/leaves/create' }
      ]
    },
    {
      label: 'Contrats',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/contracts'
    },
    {
      label: 'Rapports',
      icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      route: '/reports'
    },
    {
      label: 'Paramètres',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      route: '/settings'
    }
  ];

  constructor(
    private authService: AuthService,
    public router: Router
  ) {}

  toggleSubMenu(item: NavItem): void {
    item.expanded = !item.expanded;
  }

  isRouteActive(route: string): boolean {
    return this.router.isActive(route, false);
  }
}
