import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { DepartementsService } from '../../../services/services/departements.service';
import { DepartementDto } from '../../../services/models/departement-dto';
import { EmployeeShortDto } from '../../../services/models/employee-short-dto';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-department-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './department-detail.component.html',
  styleUrl: './department-detail.component.css'
})
export class DepartmentDetailComponent implements OnInit {
  departmentId: number = 0;
  department: DepartementDto | null = null;
  subDepartments: DepartementDto[] = [];
  employees: EmployeeShortDto[] = [];

  activeTab: 'info' | 'subdepartments' | 'employees' = 'info';

  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private departmentsService: DepartementsService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/departments/list']);
        return;
      }

      this.departmentId = Number(id);
      this.loadDepartmentData(this.departmentId);
    });
  }

  loadDepartmentData(departmentId: number) {
    this.loading = true;
    this.error = null;

    forkJoin({
      department: this.departmentsService.getDepartementById({ id: departmentId }).pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des détails du département', error);
          this.error = 'Impossible de charger les détails du département.';
          return of(null);
        })
      ),
      subDepartments: this.departmentsService.getSubDepartements({ id: departmentId }).pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des sous-départements', error);
          return of([]);
        })
      ),
      employees: this.departmentsService.getEmployeesByDepartement({
        id: departmentId,
        pageable: { page: 0, size: 20, sort: ['firstName,asc'] }
      }).pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des employés', error);
          return of({ content: [] });
        })
      )
    }).subscribe({
      next: (data) => {
        this.department = data.department;
        this.subDepartments = data.subDepartments;
        this.employees = data.employees.content || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données du département', error);
        this.error = 'Une erreur est survenue lors du chargement des données.';
        this.loading = false;
      }
    });
  }

  setActiveTab(tab: 'info' | 'subdepartments' | 'employees'): void {
    this.activeTab = tab;
  }

  toggleDepartmentStatus(): void {
    if (!this.department || this.department.id === undefined) return;

    const newStatus = !this.department.active;

    this.departmentsService.updateDepartementStatus({
      id: this.department.id,
      active: newStatus
    }).subscribe({
      next: (updatedDept) => {
        this.department = updatedDept;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut', error);
      }
    });
  }

  deleteDepartment(): void {
    if (!this.department || this.department.id === undefined) return;

    if (confirm('Êtes-vous sûr de vouloir supprimer ce département ? Cette action est irréversible.')) {
      this.departmentsService.deleteDepartement({ id: this.department.id }).subscribe({
        next: () => {
          this.router.navigate(['/departments/list']);
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
}
