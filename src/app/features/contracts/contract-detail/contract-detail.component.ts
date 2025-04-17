import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContratsService } from '../../../services/services/contrats.service';
import { DocumentManagementService } from '../../../services/services/document-management.service';
import { ContractDto } from '../../../services/models/contract-dto';
import { DocumentShortDto } from '../../../services/models/document-short-dto';
import { ContractStatusUpdateDto } from '../../../services/models/contract-status-update-dto';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-contract-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './contract-detail.component.html',
})
export class ContractDetailComponent implements OnInit {
  contractId: number;
  contract: ContractDto | null = null;
  documents: DocumentShortDto[] = [];
  loading = true;
  error: string | null = null;

  // Upload document
  showUploadForm = false;
  selectedFile: File | null = null;
  documentType = 'CONTRACT';
  documentName = '';
  uploadingDocument = false;

  // Pour le formulaire de changement de statut
  showStatusForm = false;
  newStatus: string = '';
  terminationReason: string = '';
  updatingStatus = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contractsService: ContratsService,
    private documentService: DocumentManagementService
  ) {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/contracts']);
      this.contractId = 0;
    } else {
      this.contractId = +id;
    }
  }

  ngOnInit(): void {
    this.loadContractData();
  }

  loadContractData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      contract: this.contractsService.getContractById({ id: this.contractId }).pipe(
        catchError(err => {
          console.error('Erreur lors du chargement du contrat', err);
          this.error = 'Impossible de charger les données du contrat';
          return of(null);
        })
      ),
      documents: this.documentService.getContractDocuments({ contractId: this.contractId }).pipe(
        catchError(err => {
          console.error('Erreur lors du chargement des documents', err);
          return of([]);
        })
      )
    }).subscribe(results => {
      this.contract = results.contract;
      this.documents = results.documents;
      this.loading = false;
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      if (!this.documentName) {
        this.documentName = this.selectedFile.name;
      }
    }
  }

  uploadDocument(): void {
    if (!this.selectedFile) {
      return;
    }

    this.uploadingDocument = true;

    // Create FormData object for proper multipart/form-data submission
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    this.documentService.uploadContractDocument({
      contractId: this.contractId,
      type: this.documentType as any,
      name: this.documentName,
      body: formData
    }).subscribe({
      next: () => {
        this.uploadingDocument = false;
        this.selectedFile = null;
        this.documentName = '';
        this.showUploadForm = false;
        this.loadContractData();
      },
      error: (err) => {
        console.error('Erreur lors de l\'upload du document', err);
        this.error = 'Impossible de télécharger le document';
        this.uploadingDocument = false;
      }
    });
  }

  downloadDocument(documentId: number): void {
    this.documentService.getDocumentContent({ id: documentId })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          const doc = this.documents.find(d => d.id === documentId);
          a.href = url;
          a.download = doc?.name || `document-${documentId}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: (err) => {
          console.error('Erreur lors du téléchargement du document', err);
          this.error = 'Impossible de télécharger le document';
        }
      });
  }

  deleteDocument(documentId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      this.documentService.deleteDocument({ id: documentId })
        .subscribe({
          next: () => {
            this.loadContractData();
          },
          error: (err) => {
            console.error('Erreur lors de la suppression du document', err);
            this.error = 'Impossible de supprimer le document';
          }
        });
    }
  }

  generateContractDocument(): void {
    this.contractsService.generateContractDocument({ id: this.contractId })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `contrat-${this.contractId}.docx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: (err) => {
          console.error('Erreur lors de la génération du document', err);
          this.error = 'Impossible de générer le document de contrat';
        }
      });
  }

  deleteContract(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.')) {
      this.contractsService.deleteContract({ id: this.contractId })
        .subscribe({
          next: () => {
            this.router.navigate(['/contracts']);
          },
          error: (err) => {
            console.error('Erreur lors de la suppression du contrat', err);
            this.error = 'Impossible de supprimer le contrat';
          }
        });
    }
  }

  showStatusChangeForm(status: string): void {
    this.newStatus = status;
    this.terminationReason = '';
    this.showStatusForm = true;
  }

  updateContractStatus(): void {
    if (this.newStatus === 'TERMINATED' && !this.terminationReason) {
      alert('Veuillez indiquer un motif de résiliation');
      return;
    }

    this.updatingStatus = true;

    const statusData: ContractStatusUpdateDto = {
      status: this.newStatus as any,
      terminationReason: this.newStatus === 'TERMINATED' ? this.terminationReason : undefined
    };

    this.contractsService.updateContractStatus({
      id: this.contractId,
      body: statusData
    }).subscribe({
      next: () => {
        this.updatingStatus = false;
        this.showStatusForm = false;
        this.loadContractData();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour du statut', err);
        this.error = 'Impossible de mettre à jour le statut du contrat';
        this.updatingStatus = false;
      }
    });
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getContractTypeName(type: string): string {
    const typeMap: { [key: string]: string } = {
      'CDI': 'CDI',
      'CDD': 'CDD',
      'STAGE': 'Stage',
      'INTERIM': 'Intérim',
      'FREELANCE': 'Freelance',
      'APPRENTICESHIP': 'Apprentissage',
      'PART_TIME': 'Temps partiel'
    };
    return typeMap[type] || type;
  }

  getContractStatusName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'DRAFT': 'Brouillon',
      'PENDING': 'En attente',
      'ACTIVE': 'Actif',
      'EXPIRED': 'Expiré',
      'TERMINATED': 'Résilié',
      'RENEWED': 'Renouvelé'
    };
    return statusMap[status] || status;
  }

  getContractStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'ACTIVE': 'bg-green-100 text-green-800',
      'EXPIRED': 'bg-red-100 text-red-800',
      'TERMINATED': 'bg-red-100 text-red-800',
      'RENEWED': 'bg-blue-100 text-blue-800'
    };
    return classMap[status] || 'bg-gray-100 text-gray-800';
  }

  getDocumentTypeName(type: string): string {
    const typeMap: { [key: string]: string } = {
      'CV': 'CV',
      'IDENTITY': 'Pièce d\'identité',
      'DIPLOMA': 'Diplôme',
      'CONTRACT': 'Contrat',
      'PAYSLIP': 'Bulletin de paie',
      'CERTIFICATE': 'Certificat',
      'ADMINISTRATIVE': 'Document administratif',
      'OTHER': 'Autre'
    };
    return typeMap[type] || type;
  }
}
