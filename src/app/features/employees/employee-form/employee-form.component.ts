import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { EmployeeService } from '../../../services/services/employee.service';
import { DepartementsService } from '../../../services/services/departements.service';
import { PositionsService } from '../../../services/services/positions.service';
import { EmployeeDto } from '../../../services/models/employee-dto';
import { DepartementDto } from '../../../services/models/departement-dto';
import { PositionDto } from '../../../services/models/position-dto';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import {Page, PageDepartementDto, PageEmployeeDto } from '../../../services/models';


enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED'
}

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './employee-form.component.html',
  styleUrl: './employee-form.component.css'
})
export class EmployeeFormComponent implements OnInit {
  employeeForm: FormGroup;
  isEditMode = false;
  employeeId?: number;

  departments: DepartementDto[] = [];
  positions: PositionDto[] = [];
  managers: EmployeeDto[] = [];


  genders = Object.values(Gender);
  statuses = Object.values(Status);

  loading = false;
  submitting = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private departementsService: DepartementsService,
    private positionsService: PositionsService
  ) {
    this.employeeForm = this.createEmployeeForm();
  }

  ngOnInit(): void {
    this.loadFormData();

    // Determine if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.employeeId = +id;
        this.loadEmployeeData(+id);
      }
    });

    // Setup dependent dropdowns
    this.setupDependentDropdowns();
  }

  createEmployeeForm(): FormGroup {
    return this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      phone: ['', [Validators.pattern('[0-9]{10}')]],
      birthDate: [''],
      hireDate: ['', Validators.required],
      endDate: [''],
      gender: ['', Validators.required],
      address: [''],
      city: [''],
      socialSecurityNumber: [''],
      emergencyContactName: [''],
      emergencyContactPhone: ['', [Validators.pattern('[0-9]{10}')]],
      bankAccountInfo: [''],
      status: ['ACTIVE', Validators.required],
      departementId: [''],
      positionId: [''],
      managerId: ['']
    });
  }

  loadFormData(): void {
    this.loading = true;

    const pageable = { page: 0, size: 100, sort: ['name,asc'] };
    const pageable2 = { page: 0, size: 100, sort: ['title,asc'] };
    const pageable3 = { page: 0, size: 100, sort: ['firstName,asc'] };

    forkJoin({
      departments: this.departementsService.getAllDepartements({ arg0: pageable }).pipe(
        catchError(() => of({ content: [] } as PageDepartementDto))
      ),
      positions: this.positionsService.getAllPositions({ arg0: pageable2 }).pipe(
        catchError(() => of({ content: [] } as Page))
      ),
      managers: this.employeeService.getAllEmployees({ arg0: pageable3 }).pipe(
        catchError(() => of({ content: [] } as PageEmployeeDto))
      )
    }).subscribe(results => {
      this.departments = results.departments?.content || [];
      this.positions = results.positions?.content || [];
      this.managers = results.managers?.content || [];
      this.loading = false;
    });
  }

  loadEmployeeData(id: number): void {
    this.loading = true;

    this.employeeService.getEmployeeById({ id }).pipe(
      catchError(error => {
        console.error('Error loading employee data', error);
        this.error = 'Erreur lors du chargement des données de l\'employé';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe(employee => {
      if (employee) {
        this.employeeForm.patchValue({
          firstName: employee.firstName,
          lastName: employee.lastName,
          phone: employee.phone,
          birthDate: this.formatDateForInput(employee.birthDate),
          hireDate: this.formatDateForInput(employee.hireDate),
          endDate: this.formatDateForInput(employee.endDate),
          gender: employee.gender,
          address: employee.address,
          city: employee.city,
          socialSecurityNumber: employee.socialSecurityNumber,
          emergencyContactName: employee.emergencyContactName,
          emergencyContactPhone: employee.emergencyContactPhone,
          bankAccountInfo: employee.bankAccountInfo,
          status: employee.status,
          departementId: employee.departement?.id,
          positionId: employee.position?.id,
          managerId: employee.manager?.id
        });
      }
    });
  }

  setupDependentDropdowns(): void {
    // Filter positions based on selected department
    this.employeeForm.get('departementId')?.valueChanges.subscribe(departmentId => {
      if (departmentId) {
        this.positionsService.getPositionsByDepartment({ departmentId }).subscribe(positions => {

          if (Array.isArray(positions)) {
            this.positions = positions;
          } else if (positions && typeof positions === 'object') {
            const positionsObj = positions as { content?: PositionDto[] };
            this.positions = positionsObj.content || [];
          } else {
            this.positions = [];
          }
        });
      } else {
        this.positions = [];
      }
    });
  }

  formatDateForInput(dateString: string | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched(this.employeeForm);
      return;
    }

    this.submitting = true;
    this.error = null;
    this.successMessage = null;

    const employeeData = this.employeeForm.value;

    let request$: Observable<EmployeeDto>;

    if (this.isEditMode && this.employeeId) {
      request$ = this.employeeService.updateEmployee({
        body: employeeData
      });
    } else {
      request$ = this.employeeService.createEmployee({
        body: employeeData
      });
    }

    request$.pipe(
      catchError(error => {
        console.error('Error saving employee', error);
        this.error = 'Erreur lors de l\'enregistrement de l\'employé';
        return of(null);
      }),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe(response => {
      if (response) {
        this.successMessage = this.isEditMode
          ? 'L\'employé a été mis à jour avec succès'
          : 'L\'employé a été créé avec succès';

        // Navigate back to list after short delay
        setTimeout(() => {
          this.router.navigate(['/employees/list']);
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
    if (this.isEditMode && this.employeeId) {
      this.loadEmployeeData(this.employeeId);
    } else {
      this.employeeForm.reset();
      this.employeeForm.patchValue({ status: 'ACTIVE' });
    }
  }

  get f(): { [key: string]: any } {
    return this.employeeForm.controls;
  }

}
