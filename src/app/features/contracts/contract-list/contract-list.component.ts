import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ContratsService } from '../../../services/services/contrats.service';
import { ContractDto } from '../../../services/models/contract-dto';
import { Pageable } from '../../../services/models/pageable';

@Component({
  selector: 'app-contract-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contract-list.component.html',
})
export class ContractListComponent implements OnInit {
  contracts: ContractDto[] = [];
  loading = true;
  error: string | null = null;

  // Pagination
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  // Filtres
  statusFilter: string | null = null;
  typeFilter: string | null = null;
  searchTerm = '';

  constructor(private contractsService: ContratsService) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading = true;

    const pageable: Pageable = {
      page: this.currentPage,
      size: this.pageSize,
      sort: ['startDate,desc']
    };

    this.contractsService.searchContracts({
      status: this.statusFilter as any,
      type: this.typeFilter as any,
      keyword: this.searchTerm || undefined,
      pageable: pageable
    }).subscribe({
      next: (response) => {
        this.contracts = response.content || [];
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des contrats', err);
        this.error = 'Impossible de charger les contrats';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadContracts();
  }

  resetFilters(): void {
    this.statusFilter = null;
    this.typeFilter = null;
    this.searchTerm = '';
    this.currentPage = 0;
    this.loadContracts();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadContracts();
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
}
