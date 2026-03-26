import { Component, OnInit } from '@angular/core';

import { RouterModule } from '@angular/router';
import { CongesService } from '../../../services/services/conges.service';
import { LeaveDto } from '../../../services/models/leave-dto';

@Component({
  selector: 'app-pending-leaves-widget',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="rounded-lg border bg-card shadow-sm">
      <div class="flex items-center justify-between px-6 py-4 border-b">
        <div>
          <h3 class="text-sm font-semibold text-card-foreground">Demandes de conges en attente</h3>
          <p class="text-xs text-muted-foreground mt-0.5">Demandes necessitant votre approbation</p>
        </div>
        <a routerLink="/leaves" class="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
          Voir tout
        </a>
      </div>

      @if (loading) {
        <div class="flex justify-center py-8">
          <svg class="animate-spin h-6 w-6 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      }

      @if (error) {
        <div class="px-6 py-6 text-center">
          <p class="text-sm text-destructive">{{ error }}</p>
        </div>
      }

      @if (!loading && !error && pendingLeaves.length === 0) {
        <div class="px-6 py-8 text-center text-sm text-muted-foreground">
          Aucune demande en attente
        </div>
      }

      @if (!loading && !error && pendingLeaves.length > 0) {
        <div class="divide-y">
          @for (leave of pendingLeaves; track leave.id) {
            <div class="px-6 py-3 hover:bg-muted/50 transition-colors">
              <div class="flex items-center gap-4">
                <img
                  class="h-9 w-9 rounded-full ring-1 ring-border shrink-0"
                  src="https://ui-avatars.com/api/?name={{leave.employee?.firstName}}+{{leave.employee?.lastName}}&background=18181b&color=fafafa&size=36"
                  alt="">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between">
                    <p class="text-sm font-medium text-card-foreground truncate">
                      {{ leave.employee?.firstName }} {{ leave.employee?.lastName }}
                    </p>
                    <span class="text-xs text-muted-foreground shrink-0">{{ leave.durationDays }}j</span>
                  </div>
                  <p class="text-xs text-muted-foreground mt-0.5">{{ getLeaveTypeName(leave.leaveType) }}</p>
                  <p class="text-xs text-muted-foreground">{{ formatDate(leave.startDate) }} - {{ formatDate(leave.endDate) }}</p>
                </div>
              </div>
              <div class="mt-2 flex justify-end gap-2">
                <button
                  type="button"
                  (click)="rejectLeave(leave.id)"
                  class="inline-flex items-center rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-accent transition-colors">
                  Refuser
                </button>
                <button
                  type="button"
                  (click)="approveLeave(leave.id)"
                  class="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                  Approuver
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class PendingLeavesWidgetComponent implements OnInit {
  pendingLeaves: LeaveDto[] = [];
  loading = true;
  error: string | null = null;

  constructor(private congesService: CongesService) {}

  ngOnInit(): void {
    this.loadPendingLeaves();
  }

  loadPendingLeaves(): void {
    this.loading = true;
    this.error = null;


    this.congesService.searchLeaves({
      status: 'PENDING',
      pageable: {
        page: 0,
        size: 5,
        sort: ['startDate,asc']
      }
    }).subscribe({
      next: (response) => {
        this.pendingLeaves = response.content || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des congés en attente', error);
        this.error = 'Impossible de charger les demandes de congés';
        this.loading = false;
      }
    });
  }

  approveLeave(leaveId: number | undefined): void {
    if (!leaveId) return;

    this.congesService.updateLeaveStatus({
      id: leaveId,
      body: {
        status: 'APPROVED'
      }
    }).subscribe({
      next: () => {
        this.loadPendingLeaves();
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation du congé', error);
        this.error = 'Impossible d\'approuver la demande';
      }
    });
  }

  rejectLeave(leaveId: number | undefined): void {
    if (!leaveId) return;

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
        this.loadPendingLeaves();
      },
      error: (error) => {
        console.error('Erreur lors du refus du congé', error);
        this.error = 'Impossible de refuser la demande';
      }
    });
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
}
