import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CongesService } from '../../../services/services/conges.service';
import { LeaveDto } from '../../../services/models/leave-dto';
import { Pageable } from '../../../services/models';

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './leave-list.component.html',
})
export class LeaveListComponent implements OnInit {
  leaves: LeaveDto[] = [];

  // Filtres
  selectedStatus: string = '';
  selectedType: string = '';
  dateRange: { start?: string, end?: string } = {};

  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  // États
  loading: boolean = true;
  error: string | null = null;

  // Types et statuts pour les filtres
  leaveTypes = ['ANNUAL_LEAVE', 'SICK_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'UNPAID_LEAVE', 'BEREAVEMENT_LEAVE', 'MARRIAGE_LEAVE', 'TRAINING_LEAVE', 'SABBATICAL_LEAVE', 'OTHER'];
  leaveStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'IN_PROGRESS', 'COMPLETED'];

  constructor(private congesService: CongesService) {}

  ngOnInit(): void {
    this.loadLeaves();
  }

  loadLeaves(): void {
    this.loading = true;
    this.error = null;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sort: ['startDate,desc']
    };

    this.congesService.searchLeaves({
      status: this.selectedStatus as any || undefined,
      leaveType: this.selectedType as any || undefined,
      startDateMin: this.dateRange.start,
      startDateMax: this.dateRange.end,
      pageable: pageable
    }).subscribe({
      next: (response) => {
        this.leaves = response.content || [];
        this.totalItems = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des congés', error);
        this.error = 'Impossible de charger la liste des congés. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadLeaves();
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.selectedType = '';
    this.dateRange = {};
    this.currentPage = 0;
    this.loadLeaves();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadLeaves();
    }
  }

  approveLeave(leaveId: number): void {
    this.congesService.updateLeaveStatus({
      id: leaveId,
      body: {
        status: 'APPROVED'
      }
    }).subscribe({
      next: () => {
        this.loadLeaves();
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation du congé', error);
        this.error = 'Impossible d\'approuver la demande de congé.';
      }
    });
  }

  rejectLeave(leaveId: number): void {
    const reason = prompt('Motif du refus :');
    if (reason === null) return;

    this.congesService.updateLeaveStatus({
      id: leaveId,
      body: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    }).subscribe({
      next: () => {
        this.loadLeaves();
      },
      error: (error) => {
        console.error('Erreur lors du refus du congé', error);
        this.error = 'Impossible de refuser la demande de congé.';
      }
    });
  }

  cancelLeave(leaveId: number): void {
    if (confirm('Êtes-vous sûr de vouloir annuler cette demande de congé ?')) {
      this.congesService.cancelLeave({ id: leaveId }).subscribe({
        next: () => {
          this.loadLeaves();
        },
        error: (error) => {
          console.error('Erreur lors de l\'annulation du congé', error);
          this.error = 'Impossible d\'annuler la demande de congé.';
        }
      });
    }
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getLeaveTypeName(type: string): string {
    const typeMap: { [key: string]: string } = {
      'ANNUAL_LEAVE': 'Congés payés',
      'SICK_LEAVE': 'Maladie',
      'MATERNITY_LEAVE': 'Maternité',
      'PATERNITY_LEAVE': 'Paternité',
      'UNPAID_LEAVE': 'Sans solde',
      'BEREAVEMENT_LEAVE': 'Décès',
      'MARRIAGE_LEAVE': 'Mariage',
      'TRAINING_LEAVE': 'Formation',
      'SABBATICAL_LEAVE': 'Sabbatique',
      'OTHER': 'Autre'
    };
    return typeMap[type] || type;
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-purple-100 text-purple-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }

  getStatusName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'En attente',
      'APPROVED': 'Approuvé',
      'REJECTED': 'Refusé',
      'CANCELLED': 'Annulé',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminé'
    };
    return statusMap[status] || status;
  }

  protected readonly Math = Math;
}
