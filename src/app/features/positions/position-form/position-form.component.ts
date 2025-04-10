import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PositionsService } from '../../../services/services/positions.service';
import { DepartementsService } from '../../../services/services/departements.service';
import { PositionDto } from '../../../services/models/position-dto';
import { DepartementDto } from '../../../services/models/departement-dto';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PageDepartementDto } from '../../../services/models';

@Component({
  selector: 'app-position-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './position-form.component.html',
  styleUrl: './position-form.component.css'
})
export class PositionFormComponent implements OnInit {
  positionForm: FormGroup;
  isEditMode = false;
  positionId?: number;
  departments: DepartementDto[] = [];

  loading = false;
  submitting = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private positionsService: PositionsService,
    private departementsService: DepartementsService
  ) {
    this.positionForm = this.createPositionForm();
  }

  ngOnInit(): void {
    this.loadDepartments();

    // Determine if we're in edit mode
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.positionId = +id;
        this.loadPositionData(+id);
      }
    });
  }

  createPositionForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      grade: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(10)]],
      minSalary: [null, [Validators.required, Validators.min(0)]],
      maxSalary: [null, [Validators.required, Validators.min(0)]],
      departmentId: [null],
      responsibilities: ['', [Validators.maxLength(1000)]],
      requirements: ['', [Validators.maxLength(1000)]],
      active: [true]
    }, {validators: this.salaryRangeValidator});
  }

  // Validateur personnalisé pour vérifier que maxSalary > minSalary
  salaryRangeValidator(form: FormGroup) {
    const minSalary = form.get('minSalary')?.value;
    const maxSalary = form.get('maxSalary')?.value;

    if (minSalary !== null && maxSalary !== null && minSalary > maxSalary) {
      form.get('maxSalary')?.setErrors({salaryRangeInvalid: true});
      return {salaryRangeInvalid: true};
    }

    return null;
  }

  loadDepartments(): void {
    const pageable = {page: 0, size: 100, sort: ['name,asc']};

    this.departementsService.getAllDepartements({pageable: pageable}).pipe(
      catchError(() => of({content: []} as PageDepartementDto))
    ).subscribe(result => {
      this.departments = result?.content || [];
    });
  }

  loadPositionData(id: number): void {
    this.loading = true;

    this.positionsService.getPositionById({id}).pipe(
      catchError(error => {
        console.error('Error loading position data', error);
        this.error = 'Erreur lors du chargement des données du poste';
        return of(null);
      }),
      finalize(() => {
        this.loading = false;
      })
    ).subscribe(position => {
      if (position) {
        this.positionForm.patchValue({
          title: position.title,
          description: position.description,
          grade: position.grade,
          minSalary: position.minSalary,
          maxSalary: position.maxSalary,
          departmentId: position.department?.id,
          responsibilities: position.responsibilities,
          requirements: position.requirements,
          active: position.active
        });
      }
    });
  }

  onSubmit(): void {
    if (this.positionForm.invalid) {
      this.markFormGroupTouched(this.positionForm);
      return;
    }

    this.submitting = true;
    this.error = null;
    this.successMessage = null;

    const positionData = this.positionForm.value;

    let request$: Observable<PositionDto>;

    if (this.isEditMode && this.positionId) {
      request$ = this.positionsService.updatePosition({
        id: this.positionId,
        body: positionData
      });
    } else {
      request$ = this.positionsService.createPosition({
        body: positionData
      });
    }

    request$.pipe(
      catchError(error => {
        console.error('Error saving position', error);
        this.error = 'Erreur lors de l\'enregistrement du poste';
        return of(null);
      }),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe(response => {
      if (response) {
        this.successMessage = this.isEditMode
          ? 'Le poste a été mis à jour avec succès'
          : 'Le poste a été créé avec succès';

        // Navigate back to list after short delay
        setTimeout(() => {
          this.router.navigate(['/positions/list']);
        }, 1500);
      }
    });
  }

  checkTitleExists(): void {
    const title = this.positionForm.get('title')?.value;
    if (!title || title.length < 2) return;

    const excludeId = this.isEditMode && this.positionId ? this.positionId : 0;

    this.positionsService.checkTitleExists({
      title: title,
      excludeId: excludeId
    }).subscribe(exists => {
      if (exists) {
        this.positionForm.get('title')?.setErrors({titleExists: true});
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
    if (this.isEditMode && this.positionId) {
      this.loadPositionData(this.positionId);
    } else {
      this.positionForm.reset({
        active: true
      });
    }
  }

  get f(): { [key: string]: any } {
    return this.positionForm.controls;
  }
}
