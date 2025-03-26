import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EmployeeService } from '../../services/services/employee.service';
import { DepartementsService } from '../../services/services/departements.service';
import { PositionsService } from '../../services/services/positions.service';
import { ContratsService } from '../../services/services/contrats.service';
import {ContractDto} from '../../services/models/contract-dto';
import {EmployeeDto} from '../../services/models/employee-dto';

interface StatCard {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: string;
  bgColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  // Stats cards
  stats: StatCard[] = [];

  // Données pour le dashboard
  recentEmployees: EmployeeDto[] = [];
  expiringContracts: ContractDto[] = [];
  departmentStats: any[] = [];
  loading = true;
  error = false;

  constructor(
    private employeeService: EmployeeService,
    private departementsService: DepartementsService,
    private positionsService: PositionsService,
    private contratsService: ContratsService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // On utilise forkJoin pour faire plusieurs requêtes en parallèle
    forkJoin({
      activeEmployeeCount: this.employeeService.getActiveEmployeeCount(),
      recentHires: this.employeeService.getRecentHires(),
      expiringContracts: this.contratsService.getExpiringContracts({ days: 30 }),
      departmentStats: this.employeeService.getEmployeeStatsByDepartment()
    }).subscribe({
      next: (results) => {
        // Mettre à jour les stats
        this.updateStatsCards(results);

        // Récupérer les employés récemment embauchés
        this.recentEmployees = results.recentHires;

        // Récupérer les contrats qui expirent bientôt
        this.expiringContracts = results.expiringContracts;

        // Récupérer les statistiques par département
        this.departmentStats = results.departmentStats;

        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données du dashboard', error);
        this.loading = false;
        this.error = true;
      }
    });
  }

  updateStatsCards(results: any): void {
    // Calculer les statistiques à partir des résultats
    const totalEmployees = results.activeEmployeeCount;
    const pendingLeaves = 0; // À remplacer quand le service de congés sera implémenté
    const attendanceRate = 95; // À remplacer par une donnée réelle
    const recentHiresCount = results.recentHires.length;

    this.stats = [
      {
        title: 'Effectif total',
        value: totalEmployees.toString(),
        change: '+12%', // À calculer en comparant avec la période précédente
        changeType: 'increase',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        bgColor: 'bg-blue-500'
      },
      {
        title: 'Contrats expirant',
        value: results.expiringContracts.length.toString(),
        change: '+' + results.expiringContracts.length,
        changeType: 'increase',
        icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
        bgColor: 'bg-yellow-500'
      },
      {
        title: 'Taux de présence',
        value: attendanceRate + '%',
        change: '-2%',
        changeType: 'decrease',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
        bgColor: 'bg-green-500'
      },
      {
        title: 'Nouveaux employés',
        value: recentHiresCount.toString(),
        change: '+' + recentHiresCount,
        changeType: 'increase',
        icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
        bgColor: 'bg-purple-500'
      }
    ];
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getContractStatusClass(status: string): string {
    switch(status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
      case 'TERMINATED':
        return 'bg-red-100 text-red-800';
      case 'RENEWED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }
}
