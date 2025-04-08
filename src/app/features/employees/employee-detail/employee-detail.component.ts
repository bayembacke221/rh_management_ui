import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { EmployeeService } from '../../../services/services/employee.service';
import { ContratsService } from '../../../services/services/contrats.service';
import { DocumentManagementService } from '../../../services/services/document-management.service';
import { EmployeeDto } from '../../../services/models/employee-dto';
import { ContractDto } from '../../../services/models/contract-dto';
import { DocumentDto } from '../../../services/models/document-dto';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './employee-detail.component.html',
  styleUrl: './employee-detail.component.css'
})
export class EmployeeDetailComponent implements OnInit {
  employeeId: number = 0;
  employee: EmployeeDto | null = null;
  contracts: ContractDto[] = [];
  documents: DocumentDto[] = [];

  activeTab: 'info' | 'contracts' | 'documents' | 'history' = 'info';

  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private contractsService: ContratsService,
    private documentService: DocumentManagementService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/employees/list']);
        return;
      }

      this.employeeId = Number(id);
      this.loadEmployeeData(this.employeeId);
    });
  }

  loadEmployeeData(employeeId: number) {
    this.loading = true;
    this.error = null;

    forkJoin({
      employee: this.employeeService.getEmployeeById({ id: employeeId }).pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des détails de l\'employé', error);
          this.error = 'Impossible de charger les détails de l\'employé.';
          return of(null);
        })
      ),
      contracts: this.contractsService.getEmployeeContracts({ employeeId }).pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des contrats', error);
          return of([]);
        })
      ),
      documents: this.documentService.getEmployeeDocuments({ employeeId }).pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des documents', error);
          return of([]);
        })
      )
    }).subscribe({
      next: (data) => {
        this.employee = data.employee;
        this.contracts = data.contracts;
        this.documents = data.documents;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données de l\'employé', error);
        this.error = 'Une erreur est survenue lors du chargement des données.';
        this.loading = false;
      }
    });
  }

  setActiveTab(tab: 'info' | 'contracts' | 'documents' | 'history'): void {
    this.activeTab = tab;
  }

  downloadDocument(documentId: number): void {
    this.documentService.getDocumentContent({ id: documentId }).subscribe({
      next: (response) => {
        // Créer un lien temporaire pour le téléchargement
        const docInfo = this.documents.find(d => d.id === documentId);
        if (docInfo) {
          const url = window.URL.createObjectURL(new Blob([response]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', docInfo.name || 'document');
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      },
      error: (error) => {
        console.error('Erreur lors du téléchargement du document', error);
      }
    });
  }

  formatDate(date: string | null | undefined): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'ON_LEAVE':
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
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'TERMINATED':
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'RENEWED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getDocumentTypeIcon(type: string): string {
    switch(type) {
      case 'CV':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'IDENTITY':
        return 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2';
      case 'DIPLOMA':
        return 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222';
      case 'CONTRACT':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      default:
        return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    }
  }
}
