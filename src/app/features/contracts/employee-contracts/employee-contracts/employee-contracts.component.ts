import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {DocumentShortDto} from '../../../../services/models/document-short-dto';
import {ContractDto} from '../../../../services/models/contract-dto';
import {ContratsService} from '../../../../services/services/contrats.service';
import {DocumentManagementService} from '../../../../services/services/document-management.service';
import {ContractCreateDto} from '../../../../services/models/contract-create-dto';
import {ContractStatusUpdateDto} from '../../../../services/models/contract-status-update-dto';

@Component({
  selector: 'app-employee-contracts',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule],
  templateUrl: './employee-contracts.component.html',
})
export class EmployeeContractsComponent implements OnInit {
  @Input() employeeId!: number;

  contracts: ContractDto[] = [];
  contractDocuments: { [key: number]: DocumentShortDto[] } = {};

  loading = true;
  error: string | null = null;

  // États pour les opérations UI
  showContractForm = false;
  editingContractId: number | null = null;
  processingAction = false;
  successMessage: string | null = null;

  // Formulaire de contrat
  contractForm: FormGroup;

  // Upload document
  selectedFile: File | null = null;
  documentType = 'CONTRACT';
  documentName = '';
  uploadingDocument = false;
  activeContractId: number | null = null;

  constructor(
    private contratsService: ContratsService,
    private documentService: DocumentManagementService,
    private fb: FormBuilder
  ) {
    this.contractForm = this.createContractForm();
  }

  ngOnInit(): void {
    this.loadContracts();
  }

  createContractForm(): FormGroup {
    return this.fb.group({
      type: ['CDI', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      salary: [null, [Validators.required, Validators.min(0)]],
      workHoursPerWeek: [35, [Validators.required, Validators.min(0), Validators.max(50)]],
      status: ['DRAFT', Validators.required]
    });
  }

  loadContracts(): void {
    this.loading = true;
    this.error = null;

    this.contratsService.getEmployeeContracts({employeeId: this.employeeId})
      .pipe(
        catchError(err => {
          console.error('Erreur lors du chargement des contrats', err);
          this.error = 'Impossible de charger les contrats';
          return of([]);
        })
      )
      .subscribe(contracts => {
        this.contracts = contracts;

        // Récupère les documents pour chaque contrat
        if (contracts.length > 0) {
          const documentRequests = contracts.map(contract => {
            if (contract.id) {
              return this.documentService.getContractDocuments({contractId: contract.id})
                .pipe(
                  catchError(() => of([])),
                );
            }
            return of([]);
          });

          forkJoin(documentRequests).subscribe(documentsArray => {
            contracts.forEach((contract, index) => {
              if (contract.id) {
                this.contractDocuments[contract.id] = documentsArray[index];
              }
            });
            this.loading = false;
          });
        } else {
          this.loading = false;
        }
      });
  }

  toggleContractForm(): void {
    this.showContractForm = !this.showContractForm;
    if (!this.showContractForm) {
      this.contractForm.reset({
        type: 'CDI',
        workHoursPerWeek: 35,
        status: 'DRAFT'
      });
      this.editingContractId = null;
    }
  }

  editContract(contract: ContractDto): void {
    this.editingContractId = contract.id || null;
    this.contractForm.patchValue({
      type: contract.type,
      startDate: contract.startDate ? this.formatDateForInput(contract.startDate) : '',
      endDate: contract.endDate ? this.formatDateForInput(contract.endDate) : '',
      salary: contract.salary,
      workHoursPerWeek: contract.workHoursPerWeek,
      status: contract.status
    });
    this.showContractForm = true;
  }

  saveContract(): void {
    if (this.contractForm.invalid) {
      // Marque tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.contractForm.controls).forEach(key => {
        this.contractForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.processingAction = true;
    this.successMessage = null;

    const formValue = this.contractForm.value;

    if (this.editingContractId) {
      // Mise à jour d'un contrat existant
      this.contratsService.updateContract({
        id: this.editingContractId,
        body: {
          type: formValue.type,
          startDate: formValue.startDate,
          endDate: formValue.endDate,
          salary: formValue.salary,
          workHoursPerWeek: formValue.workHoursPerWeek
        }
      }).subscribe({
        next: () => {
          this.successMessage = 'Contrat mis à jour avec succès';
          this.processingAction = false;
          this.showContractForm = false;
          this.loadContracts();
        },
        error: err => {
          console.error('Erreur lors de la mise à jour du contrat', err);
          this.error = 'Impossible de mettre à jour le contrat';
          this.processingAction = false;
        }
      });
    } else {
      // Création d'un nouveau contrat
      const contractData: ContractCreateDto = {
        employeeId: this.employeeId,
        type: formValue.type,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        salary: formValue.salary,
        workHoursPerWeek: formValue.workHoursPerWeek,
        status: formValue.status
      };

      this.contratsService.createContract({body: contractData})
        .subscribe({
          next: () => {
            this.successMessage = 'Contrat créé avec succès';
            this.processingAction = false;
            this.showContractForm = false;
            this.loadContracts();
          },
          error: err => {
            console.error('Erreur lors de la création du contrat', err);
            this.error = 'Impossible de créer le contrat';
            this.processingAction = false;
          }
        });
    }
  }

  updateContractStatus(contractId: number, newStatus: string, reason?: string): void {
    if (newStatus === 'TERMINATED' && !reason) {
      reason = prompt('Veuillez indiquer le motif de résiliation :') || '';
      if (!reason) return;
    }

    this.processingAction = true;

    const statusData: ContractStatusUpdateDto = {
      status: newStatus as any,
      terminationReason: reason
    };

    this.contratsService.updateContractStatus({
      id: contractId,
      body: statusData
    }).subscribe({
      next: () => {
        this.successMessage = `Statut du contrat mis à jour : ${newStatus}`;
        this.processingAction = false;
        this.loadContracts();
      },
      error: err => {
        console.error('Erreur lors de la mise à jour du statut', err);
        this.error = 'Impossible de mettre à jour le statut du contrat';
        this.processingAction = false;
      }
    });
  }

  deleteContract(contractId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contrat ? Cette action est irréversible.')) {
      this.processingAction = true;

      this.contratsService.deleteContract({id: contractId})
        .subscribe({
          next: () => {
            this.successMessage = 'Contrat supprimé avec succès';
            this.processingAction = false;
            this.loadContracts();
          },
          error: err => {
            console.error('Erreur lors de la suppression du contrat', err);
            this.error = 'Impossible de supprimer le contrat';
            this.processingAction = false;
          }
        });
    }
  }

  // Méthodes de gestion des documents de contrat
  showUploadDocumentForm(contractId: number): void {
    this.activeContractId = contractId;
    this.selectedFile = null;
    this.documentName = '';
    this.documentType = 'CONTRACT';
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

  uploadContractDocument(): void {
    if (!this.selectedFile || !this.activeContractId) {
      return;
    }

    this.uploadingDocument = true;

    // Create FormData object for proper multipart/form-data submission
    const formData = new FormData();
    formData.append('file', this.selectedFile);

    // Pass the file using FormData instead of JSON
    this.documentService.uploadContractDocument({
      contractId: this.activeContractId,
      type: this.documentType as any,
      name: this.documentName,
      body: formData
    }).subscribe({
      next: () => {
        this.uploadingDocument = false;
        this.selectedFile = null;
        this.documentName = '';
        this.activeContractId = null;
        this.loadContracts();
      },
      error: err => {
        console.error('Erreur lors de l\'upload du document', err);
        this.error = 'Impossible de télécharger le document';
        this.uploadingDocument = false;
      }
    });
  }

  downloadContractDocument(documentId: number): void {
    this.documentService.getDocumentContent({id: documentId})
      .subscribe({
        next: blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          const docName = this.findDocumentName(documentId);
          a.href = url;
          a.download = docName || `document-${documentId}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: err => {
          console.error('Erreur lors du téléchargement du document', err);
          this.error = 'Impossible de télécharger le document';
        }
      });
  }

  deleteContractDocument(documentId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      this.documentService.deleteDocument({id: documentId})
        .subscribe({
          next: () => {
            this.loadContracts();
          },
          error: err => {
            console.error('Erreur lors de la suppression du document', err);
            this.error = 'Impossible de supprimer le document';
          }
        });
    }
  }

  findDocumentName(documentId: number): string {
    for (const contractId in this.contractDocuments) {
      const doc = this.contractDocuments[contractId].find(d => d.id === documentId);
      if (doc) return doc.name || '';
    }
    return '';
  }

  generateContractDocument(contractId: number): void {
    this.contratsService.generateContractDocument({id: contractId})
      .subscribe({
        next: blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `contrat-${contractId}.docx`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        },
        error: err => {
          console.error('Erreur lors de la génération du document de contrat', err);
          this.error = 'Impossible de générer le document de contrat';
        }
      });
  }

  // Utilitaires
  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
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
