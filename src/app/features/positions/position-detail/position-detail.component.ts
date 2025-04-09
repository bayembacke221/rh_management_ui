import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { PositionsService } from '../../../services/services/positions.service';
import { EmployeeService } from '../../../services/services/employee.service';
import { PositionDto } from '../../../services/models/position-dto';
import { EmployeeDto } from '../../../services/models/employee-dto';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-position-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './position-detail.component.html',
  styleUrl: './position-detail.component.css'
})
export class PositionDetailComponent implements OnInit {
  positionId: number = 0;
  position: PositionDto | null = null;
  employees: EmployeeDto[] = [];

  loading: boolean = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private positionsService: PositionsService,
    private employeeService: EmployeeService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/positions/list']);
        return;
      }

      this.positionId = Number(id);
      this.loadPositionData(this.positionId);
    });
  }

  loadPositionData(positionId: number): void {
    this.loading = true;
    this.error = null;

    // Récupérer les données de la position et les employés associés
    this.positionsService.getPositionById({ id: positionId })
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des détails du poste', error);
          this.error = 'Impossible de charger les détails du poste.';
          return of(null);
        }),
        switchMap(position => {
          if (!position) return of({ position: null, employees: [] });

          // Si on a la position, récupérer les employés qui ont ce poste
          return this.employeeService.searchEmployees({
            pageable: { page: 0, size: 100, sort: [] },
          }).pipe(
            map(employeesPage => {
              // Filtrer les employés qui ont ce poste
              const employeesWithPosition = (employeesPage.content || []).filter(
                emp => emp.position?.id === position.id
              );
              return { position, employees: employeesWithPosition };
            }),
            catchError(() => of({ position, employees: [] }))
          );
        })
      )
      .subscribe({
        next: (data) => {
          this.position = data.position;
          this.employees = data.employees;
          this.loading = false;
        },
        error: () => {
          this.error = 'Une erreur est survenue lors du chargement des données.';
          this.loading = false;
        }
      });
  }

  togglePositionStatus(): void {
    if (!this.position || this.position.id === undefined) return;

    const newStatus = !this.position.active;

    this.positionsService.updatePositionStatus({
      id: this.position.id,
      arg1: newStatus
    }).subscribe({
      next: (updatedPosition) => {
        this.position = updatedPosition;
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du statut', error);
        alert('Impossible de mettre à jour le statut. Veuillez réessayer.');
      }
    });
  }

  deletePosition(): void {
    if (!this.position || this.position.id === undefined) return;

    if (confirm(`Êtes-vous sûr de vouloir supprimer le poste "${this.position.title}" ?`)) {
      this.positionsService.deletePosition({
        id: this.position.id
      }).subscribe({
        next: () => {
          this.router.navigate(['/positions/list']);
        },
        error: (error) => {
          console.error('Erreur lors de la suppression', error);
          alert('Impossible de supprimer ce poste. Il est peut-être utilisé par des employés.');
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
}
