import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DepartementsService } from '../../../services/services/departements.service';
import { EmployeeService } from '../../../services/services/employee.service';
import { DepartementDto } from '../../../services/models/departement-dto';
import { EmployeeDto } from '../../../services/models/employee-dto';
import { DepartementCreateDto } from '../../../services/models/departement-create-dto';
import { DepartementUpdateDto } from '../../../services/models/departement-update-dto';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-department-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './department-form.component.html',
  styleUrl: './department-form.component.css'
})
export class DepartmentFormComponent implements OnInit {
  departmentForm: FormGroup;
  isEditMode = false;
  departmentId?: number;

  managers: EmployeeDto[] = [];
  parentDepartments: DepartementDto[] = [];

  loading = false;
  submitting = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private departmentsService: DepartementsService,
    private employeeService: EmployeeService
  ) {
    this.departmentForm = this.createDepartmentForm();
  }

  ngOnInit(): void {
    this.loadFormData();

    // Determine if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.departmentId = +id;
        this.loadDepartmentData(+id);
      }
    });
  }

  createDepartmentForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(20)]],
      description: [''],
      managerId: [null],
      parentDepartementId: [null],
      active: [true]
    });
  }

  loadFormData(): void {
    this.loading = true;

    const pageable = { page: 0, size: 100, sort: ['name,asc'] };
    const pageable2 = { page: 0, size: 100, sort: ['firstName,asc'] };

    forkJoin({
      departments: this.departmentsService.getAllDepartements({ pageable: pageable }).pipe(
        catchError(() => of({ content: [] }))
      ),
      employees: this.employeeService.getAllEmployees({ pageable: pageable2 }).pipe(
        catchError(() => of({ content: [] }))
      )
    }).subscribe(results => {
      this.parentDepartments = results.departments?.content || [];
      this.managers = results.employees?.content || [];
      this.loading = false;
    });
  }

  loadDepartmentData(id: number): void {
    this.loading = true;

    this.departmentsService.getDepartementById({ id }).pipe(
      catchError(error => {
        console.error('Error loading department data', error);
        this.error = 'Erreur lors du chargement des données du département';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe(department => {
      if (department) {
        this.departmentForm.patchValue({
          name: department.name,
          code: department.code,
          description: department.description,
          managerId: department.manager?.id,
          parentDepartementId: department.parentDepartement?.id,
          active: department.active
        });
      }
    });
  }

  onSubmit(): void {
    if (this.departmentForm.invalid) {
      this.markFormGroupTouched(this.departmentForm);
      return;
    }

    this.submitting = true;
    this.error = null;
    this.successMessage = null;

    const departmentData = this.departmentForm.value;

    let request$: Observable<DepartementDto>;

    if (this.isEditMode && this.departmentId) {
      const updateData: DepartementUpdateDto = {
        ...departmentData
      };
      request$ = this.departmentsService.updateDepartement({
        id: this.departmentId,
        body: updateData
      });
    } else {
      const createData: DepartementCreateDto = {
        ...departmentData
      };
      request$ = this.departmentsService.createDepartement({
        body: createData
      });
    }

    request$.pipe(
      catchError(error => {
        console.error('Error saving department', error);
        this.error = 'Erreur lors de l\'enregistrement du département';
        return of(null);
      }),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe(response => {
      if (response) {
        this.successMessage = this.isEditMode
          ? 'Le département a été mis à jour avec succès'
          : 'Le département a été créé avec succès';

        // Navigate back to list after short delay
        setTimeout(() => {
          this.router.navigate(['/departments/list']);
        }, 1500);
      }
    });
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  resetForm(): void {
    if (this.isEditMode && this.departmentId) {
      this.loadDepartmentData(this.departmentId);
    } else {
      this.departmentForm.reset({
        active: true
      });
    }
  }

  get f(): { [key: string]: any } {
    return this.departmentForm.controls;
  }
  }
