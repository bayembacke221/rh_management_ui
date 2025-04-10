import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmployeeService } from '../../../services/services/employee.service';
import { DepartementsService } from '../../../services/services/departements.service';
import { EmployeeDto } from '../../../services/models/employee-dto';
import { DepartementDto } from '../../../services/models/departement-dto';

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED'
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './employee-list.component.html',
  styleUrl: './employee-list.component.css'
})
export class EmployeeListComponent implements OnInit {
  employees: EmployeeDto[] = [];
  departments: DepartementDto[] = [];
  filteredEmployees: EmployeeDto[] = [];
  statuses = Object.values(Status);

  // Filtres
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedDepartment: string = '';

  // Pagination
  currentPage: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;

  // État
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private employeeService: EmployeeService,
    private departmentsService: DepartementsService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();
  }

  loadDepartments(): void {
    this.departmentsService.getAllDepartements({
      pageable: {
        page: 0,
        size: 10,
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

  loadEmployees(): void {
    this.loading = true;
    this.error = null;

    this.employeeService.searchEmployees({
      keyword: this.searchTerm || undefined,
      status: this.selectedStatus as 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED' | undefined,
      departmentId: this.selectedDepartment ? Number(this.selectedDepartment) : undefined,
      pageable: {
        page: this.currentPage,
        size: this.pageSize,
        sort: []
      }
    }).subscribe({
      next: (response) => {
        this.employees = response.content || [];
        this.filteredEmployees = [...this.employees];
        this.totalItems = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés', error);
        this.error = 'Impossible de charger la liste des employés. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.currentPage = 0;
    this.loadEmployees();
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedDepartment = '';
    this.currentPage = 0;
    this.loadEmployees();
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadEmployees();
    }
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

  protected readonly Math = Math;
}
