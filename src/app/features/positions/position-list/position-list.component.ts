import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PositionsService } from '../../../services/services/positions.service';
import { DepartementsService } from '../../../services/services/departements.service';
import { PositionDto } from '../../../services/models/position-dto';
import { DepartementDto } from '../../../services/models/departement-dto';
import { Page } from '../../../services/models/page';

@Component({
  selector: 'app-position-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './position-list.component.html',
  styleUrl: './position-list.component.css'
})
export class PositionListComponent implements OnInit {
  positions: PositionDto[] = [];
  departments: DepartementDto[] = [];
  filteredPositions: PositionDto[] = [];

  // Filtres
  searchTerm: string = '';
  selectedDepartment: string = '';
  activeOnly: boolean = true;

  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  // État
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private positionsService: PositionsService,
    private departmentsService: DepartementsService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadPositions();
  }

  loadDepartments(): void {
    this.departmentsService.getAllDepartements({
      pageable: {
        page: 0,
        size: 100,
        sort: []
      }
    }).subscribe({
      next: (response) => {
        this.departments = response.content || [];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des départements', error);
      }
    });
  }

  loadPositions(): void {
    this.loading = true;
    this.error = null;

    // Utiliser le service de recherche pour plus de flexibilité
    this.positionsService.searchPositions({
      keyword: this.searchTerm || undefined,
      active: this.activeOnly || undefined,
      departmentId: this.selectedDepartment ? Number(this.selectedDepartment) : undefined,
      pageable: {
        page: this.currentPage,
        size: this.pageSize,
        sort: ['title,asc']
      }
    }).subscribe({
      next: (response: Page) => {
        if (response && response.content) {
          this.positions = response.content as PositionDto[];
          this.filteredPositions = [...this.positions];
          this.totalItems = response.totalElements || 0;
          this.totalPages = response.totalPages || 0;
        } else {
          this.positions = [];
          this.filteredPositions = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des positions', error);
        this.error = 'Impossible de charger la liste des positions. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadPositions();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedDepartment = '';
    this.activeOnly = true;
    this.currentPage = 0;
    this.loadPositions();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadPositions();
    }
  }

  togglePositionStatus(position: PositionDto): void {
    if (!position.id) return;

    const newStatus = !position.active;

    this.positionsService.updatePositionStatus({
      active: newStatus,
      id: position.id
    }).subscribe({
      next: (updatedPosition) => {
        // Mettre à jour la position dans la liste
        const index = this.positions.findIndex(p => p.id === position.id);
        if (index !== -1) {
          this.positions[index] = updatedPosition;
          this.filteredPositions = [...this.positions];
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut', error);
        alert('Impossible de mettre à jour le statut. Veuillez réessayer.');
      }
    });
  }

  deletePosition(position: PositionDto): void {
    if (!position.id) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer la position "${position.title}" ?`)) {
      this.positionsService.deletePosition({
        id: position.id
      }).subscribe({
        next: () => {
          // Supprimer la position de la liste
          this.positions = this.positions.filter(p => p.id !== position.id);
          this.filteredPositions = [...this.positions];
          this.totalItems--;
        },
        error: (error) => {
          console.error('Erreur lors de la suppression', error);
          alert('Impossible de supprimer cette position. Elle est peut-être utilisée par des employés.');
        }
      });
    }
  }

  formatSalaryRange(min?: number, max?: number): string {
    if (min === undefined && max === undefined) return '-';
    if (min === undefined) return `jusqu'à ${max} FCFA`;
    if (max === undefined) return `à partir de ${min} FCFA`;
    return `${min} FCFA - ${max} FCFA`;
  }

  protected readonly Math = Math;
}
