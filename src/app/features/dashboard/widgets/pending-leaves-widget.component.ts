import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CongesService } from '../../../services/services/conges.service';
import { LeaveDto } from '../../../services/models/leave-dto';

@Component({
  selector: 'app-pending-leaves-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
   <div class="bg-white shadow rounded-lg overflow-hidden">
     <div class="px-4 py-5 sm:px-6 flex justify-between items-center">
       <div>
         <h3 class="text-lg leading-6 font-medium text-gray-900">Demandes de congés en attente</h3>
         <p class="mt-1 max-w-2xl text-sm text-gray-500">Demandes nécessitant votre approbation</p>
       </div>
       <a routerLink="/leaves" class="text-sm font-medium text-blue-600 hover:text-blue-500">
         Voir toutes les demandes
       </a>
     </div>

     <div *ngIf="loading" class="px-4 py-5 sm:p-6 flex justify-center">
       <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
     </div>

     <div *ngIf="error" class="px-4 py-5 sm:p-6 text-center text-red-500">
       {{ error }}
     </div>

     <div *ngIf="!loading && !error && pendingLeaves.length === 0" class="px-4 py-5 sm:p-6 text-center text-gray-500">
       <p>Aucune demande en attente.</p>
     </div>

     <ul *ngIf="!loading && !error && pendingLeaves.length > 0" class="divide-y divide-gray-200">
       <li *ngFor="let leave of pendingLeaves" class="px-4 py-4 sm:px-6 hover:bg-gray-50">
         <div class="flex items-center justify-between">
           <div class="flex items-center">
             <div class="flex-shrink-0 h-10 w-10">
               <img class="h-10 w-10 rounded-full" src="https://ui-avatars.com/api/?name={{leave.employee?.firstName}}+{{leave.employee?.lastName}}&background=0D8ABC&color=fff" alt="">
             </div>
             <div class="ml-4">
               <div class="text-sm font-medium text-gray-900">
                 {{ leave.employee?.firstName }} {{ leave.employee?.lastName }}
               </div>
               <div class="text-sm text-gray-500">
                 {{ getLeaveTypeName(leave.leaveType) }}
               </div>
             </div>
           </div>
           <div class="text-right">
             <div class="text-sm text-gray-900">
               {{ formatDate(leave.startDate) }} - {{ formatDate(leave.endDate) }}
             </div>
             <div class="text-sm text-gray-500">
               {{ leave.durationDays }} jour(s)
             </div>
           </div>
         </div>
         <div class="mt-2 flex justify-end space-x-2">
           <button
             (click)="rejectLeave(leave.id)"
             class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
             Refuser
           </button>
           <button
             (click)="approveLeave(leave.id)"
             class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
             Approuver
           </button>
         </div>
       </li>
     </ul>
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
