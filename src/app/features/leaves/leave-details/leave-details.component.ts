import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CongesService } from '../../../services/services/conges.service';
import { LeaveDto } from '../../../services/models/leave-dto';

@Component({
  selector: 'app-leave-details',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './leave-details.component.html',
})
export class LeaveDetailsComponent implements OnInit {
  leave?: LeaveDto;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private congesService: CongesService
  ) {}

  ngOnInit(): void {
    const leaveId = this.route.snapshot.paramMap.get('id');

    if (leaveId) {
      this.loadLeave(+leaveId);
    } else {
      this.error = 'Identifiant de congé non fourni';
      this.loading = false;
    }
  }

  loadLeave(id: number): void {
    this.congesService.getLeaveById({ id })
      .subscribe({
        next: (leave) => {
          this.leave = leave;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement du congé', error);
          this.error = 'Impossible de charger les détails de la demande de congé';
          this.loading = false;
        }
      });
  }

  approveLeave(): void {
    if (!this.leave?.id) return;

    this.congesService.updateLeaveStatus({
      id: this.leave.id,
      body: {
        status: 'APPROVED'
      }
    }).subscribe({
      next: (leave) => {
        this.leave = leave;
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation du congé', error);
        this.error = 'Impossible d\'approuver la demande de congé';
      }
    });
  }

  rejectLeave(): void {
    if (!this.leave?.id) return;

    const reason = prompt('Motif du refus :');
    if (reason === null) return;

    this.congesService.updateLeaveStatus({
      id: this.leave.id,
      body: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    }).subscribe({
      next: (leave) => {
        this.leave = leave;
      },
      error: (error) => {
        console.error('Erreur lors du refus du congé', error);
        this.error = 'Impossible de refuser la demande de congé';
      }
    });
  }

  cancelLeave(): void {
    if (!this.leave?.id) return;

    if (confirm('Êtes-vous sûr de vouloir annuler cette demande de congé ?')) {
      this.congesService.cancelLeave({ id: this.leave.id })
        .subscribe({
          next: (leave) => {
            this.leave = leave;
          },
          error: (error) => {
            console.error('Erreur lors de l\'annulation du congé', error);
            this.error = 'Impossible d\'annuler la demande de congé';
          }
        });
    }
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getLeaveTypeName(type: string | undefined | null): string {
    if (!type) return '-';

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

  getStatusName(status: string | undefined | null): string {
    if (!status) return '-';

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

  getStatusClass(status: string | undefined | null): string {
    if (!status) return '';

    const statusMap: { [key: string]: string } = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-purple-100 text-purple-800'
    };
    return statusMap[status] || '';
  }
}
