import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: string;
  bgColor: string;
}

interface RecentEmployee {
  id: number;
  name: string;
  position: string;
  department: string;
  startDate: string;
  status: 'active' | 'pending' | 'terminated';
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats: StatCard[] = [
    {
      title: 'Effectif total',
      value: '248',
      change: '+12%',
      changeType: 'increase',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      bgColor: 'bg-blue-500'
    },
    {
      title: 'Congés en attente',
      value: '14',
      change: '+3',
      changeType: 'increase',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      bgColor: 'bg-yellow-500'
    },
    {
      title: 'Taux de présence',
      value: '95%',
      change: '-2%',
      changeType: 'decrease',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      bgColor: 'bg-green-500'
    },
    {
      title: 'Nouveaux employés',
      value: '8',
      change: '+4',
      changeType: 'increase',
      icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      bgColor: 'bg-purple-500'
    }
  ];

  recentEmployees: RecentEmployee[] = [
    { id: 1, name: 'Jean Dupont', position: 'Développeur Frontend', department: 'IT', startDate: '12/02/2023', status: 'active' },
    { id: 2, name: 'Marie Martin', position: 'Responsable RH', department: 'Ressources Humaines', startDate: '08/03/2023', status: 'active' },
    { id: 3, name: 'Pierre Dubois', position: 'Comptable', department: 'Finance', startDate: '15/04/2023', status: 'pending' },
    { id: 4, name: 'Sophie Bernard', position: 'UX Designer', department: 'IT', startDate: '02/05/2023', status: 'active' },
    { id: 5, name: 'Lucas Moreau', position: 'Commercial', department: 'Ventes', startDate: '20/06/2023', status: 'terminated' }
  ];

  constructor() {}

  ngOnInit(): void {

  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
