import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DepartementsService } from '../../../services/services/departements.service';
import { DepartementDto } from '../../../services/models/departement-dto';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './department-list.component.html',
  styleUrl: './department-list.component.css'
})
export class DepartmentListComponent implements OnInit {
  departments: DepartementDto[] = [];
  filteredDepartments: DepartementDto[] = [];

  // Filtres
  searchTerm: string = '';
  showInactive: boolean = false;

  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  // État
  loading: boolean = true;
  error: string | null = null;

  constructor(private departmentsService: DepartementsService) { }

  ngOnInit(): void {
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.loading = true;
    this.error = null;

    this.departmentsService.getAllDepartements({
      arg0: {
        page: this.currentPage,
        size: this.pageSize,
        sort: ['name,asc']
      }
    }).subscribe({
      next: (response) => {
        this.departments = response.content || [];
        this.filteredDepartments = [...this.departments];
        this.totalItems = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.loading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Erreur lors du chargement des départements', error);
        this.error = 'Impossible de charger la liste des départements. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    if (!this.searchTerm && !this.showInactive) {
      this.filteredDepartments = [...this.departments];
      return;
    }

    this.filteredDepartments = this.departments.filter(dept => {
      // Filtre par recherche
      const matchesSearch = !this.searchTerm ||
        dept.name?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dept.code?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dept.description?.toLowerCase().includes(this.searchTerm.toLowerCase());

      // Filtre par statut
      const matchesStatus = !this.showInactive || (dept.active !== undefined ? !dept.active : false);

      return matchesSearch && matchesStatus;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.showInactive = false;
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadDepartments();
    }
  }

  toggleDepartmentStatus(department: DepartementDto): void {
    if (department.id === undefined) return;

    const newStatus = !department.active;

    this.departmentsService.updateDepartementStatus({
      id: department.id,
      arg1: newStatus
    }).subscribe({
      next: (updatedDept) => {
        const index = this.departments.findIndex(d => d.id === department.id);
        if (index !== -1) {
          this.departments[index] = updatedDept;
          this.applyFilters();
        }
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut', error);
        // Rétablir le statut précédent
        department.active = !newStatus;
      }
    });
  }

  deleteDepartment(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce département ? Cette action est irréversible.')) {
      this.departmentsService.deleteDepartement({ id }).subscribe({
        next: () => {
          this.departments = this.departments.filter(d => d.id !== id);
          this.applyFilters();
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du département', error);
          if (error?.status === 400) {
            alert('Ce département ne peut pas être supprimé car il contient des employés ou des sous-départements.');
          } else {
            alert('Une erreur est survenue lors de la suppression du département.');
          }
        }
      });
    }
  }

  protected readonly Math = Math;
}
