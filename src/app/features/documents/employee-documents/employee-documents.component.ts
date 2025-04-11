import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocumentManagementService } from '../../../services/services/document-management.service';
import { DocumentShortDto } from '../../../services/models/document-short-dto';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employee-documents',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './employee-documents.component.html',
})
export class EmployeeDocumentsComponent implements OnInit {
  @Input() employeeId!: number;
  documents: DocumentShortDto[] = [];
  loading = true;
  error: string | null = null;

  // Add this property
  uploadPanelVisible = false;

  // Variables pour l'upload de document
  selectedFile: File | null = null;
  documentType: string = 'CV';
  documentName: string = '';
  uploading = false;

  constructor(
    private documentService: DocumentManagementService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments() {
    this.loading = true;
    this.error = null;

    this.documentService.getEmployeeDocuments({ employeeId: this.employeeId })
      .subscribe({
        next: (documents) => {
          this.documents = documents;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des documents', err);
          this.error = 'Impossible de charger les documents de l\'employé';
          this.loading = false;
        }
      });
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.selectedFile = input.files[0];
      if (!this.documentName) {
        this.documentName = this.selectedFile.name;
      }
    }
  }

  uploadDocument() {
    if (!this.selectedFile) {
      return;
    }

    this.uploading = true;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const blob = new Blob([fileReader.result as ArrayBuffer], { type: this.selectedFile!.type });

      this.documentService.uploadEmployeeDocument({
        employeeId: this.employeeId,
        type: this.documentType as any,
        name: this.documentName,
        body: { file: blob }
      }).subscribe({
        next: () => {
          this.uploading = false;
          this.selectedFile = null;
          this.documentName = '';
          this.uploadPanelVisible = false;
          this.loadDocuments();
        },
        error: (err) => {
          console.error('Erreur lors de l\'upload du document', err);
          this.error = 'Impossible de télécharger le document';
          this.uploading = false;
        }
      });
    };

    fileReader.readAsArrayBuffer(this.selectedFile);
  }

  downloadDocument(documentId: number) {
    this.documentService.getEmployeeDocumentContent({
      employeeId: this.employeeId,
      documentId: documentId
    }).subscribe({
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

  deleteDocument(documentId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      this.documentService.deleteDocument({ id: documentId })
        .subscribe({
          next: () => {
            this.loadDocuments();
          },
          error: (err) => {
            console.error('Erreur lors de la suppression du document', err);
            this.error = 'Impossible de supprimer le document';
          }
        });
    }
  }

  getDocumentTypeName(type: string): string {
    const typeMap: {[key: string]: string} = {
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

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }
}
