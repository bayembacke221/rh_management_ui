import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContratsService } from '../../../services/services/contrats.service';
import { EmployeeService } from '../../../services/services/employee.service';
import { EmployeeShortDto } from '../../../services/models/employee-short-dto';
import { ContractDto } from '../../../services/models/contract-dto';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './contract-form.component.html',
})
export class ContractFormComponent implements OnInit {
  contractForm: FormGroup;
  employees: EmployeeShortDto[] = [];
  loading = false;
  submitting = false;
  error: string | null = null;
  successMessage: string | null = null;
  editMode = false;
  contractId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private contractsService: ContratsService,
    private employeeService: EmployeeService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.contractForm = this.createForm();
  }

  ngOnInit(): void {
    this.loading = true;

    // Charger la liste des employés pour le formulaire
    this.employeeService.getAllEmployees({
      pageable: {
        page: 0,
        size: 1000,
        sort: ['lastName,asc']
      }
    }).pipe(
      catchError(err => {
        console.error('Erreur lors du chargement des employés', err);
        this.error = 'Impossible de charger la liste des employés';
        return of({ content: [] });
      })
    ).subscribe(response => {
      this.employees = response.content || [];

      // Vérifier s'il s'agit d'une modification de contrat existant
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.contractId = +id;
        this.editMode = true;
        this.loadContractData(this.contractId);
      } else {
        this.loading = false;
      }
    });
  }

  createForm(): FormGroup {
    return this.fb.group({
      employeeId: [null, Validators.required],
      type: ['CDI', Validators.required],
      startDate: ['', Validators.required],
      endDate: [''],
      salary: [null, [Validators.required, Validators.min(0)]],
      workHoursPerWeek: [35, [Validators.required, Validators.min(0), Validators.max(50)]],
      status: ['DRAFT', Validators.required]
    });
  }

  loadContractData(id: number): void {
    this.contractsService.getContractById({ id }).subscribe({
      next: (contract) => {
        this.contractForm.patchValue({
          employeeId: contract.employee?.id,
          type: contract.type,
          startDate: this.formatDateForInput(contract.startDate),
          endDate: contract.endDate ? this.formatDateForInput(contract.endDate) : '',
          salary: contract.salary,
          workHoursPerWeek: contract.workHoursPerWeek,
          status: contract.status
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du contrat', err);
        this.error = 'Impossible de charger les données du contrat';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.contractForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les erreurs
      Object.keys(this.contractForm.controls).forEach(key => {
        this.contractForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = null;
    this.successMessage = null;

    const formValue = this.contractForm.value;

    if (this.editMode && this.contractId) {
      // Mise à jour d'un contrat existant
      this.contractsService.updateContract({
        id: this.contractId,
        body: {
          type: formValue.type,
          startDate: formValue.startDate,
          endDate: formValue.endDate || null,
          salary: formValue.salary,
          workHoursPerWeek: formValue.workHoursPerWeek
        }
      }).subscribe({
        next: () => {
          this.successMessage = 'Contrat mis à jour avec succès';
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(['/contracts']);
          }, 1500);
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du contrat', err);
          this.error = 'Impossible de mettre à jour le contrat';
          this.submitting = false;
        }
      });
    } else {
      // Création d'un nouveau contrat
      this.contractsService.createContract({
        body: {
          employeeId: formValue.employeeId,
          type: formValue.type,
          startDate: formValue.startDate,
          endDate: formValue.endDate || null,
          salary: formValue.salary,
          workHoursPerWeek: formValue.workHoursPerWeek,
          status: formValue.status
        }
      }).subscribe({
        next: () => {
          this.successMessage = 'Contrat créé avec succès';
          this.submitting = false;
          setTimeout(() => {
            this.router.navigate(['/contracts']);
          }, 1500);
        },
        error: (err) => {
          console.error('Erreur lors de la création du contrat', err);
          this.error = 'Impossible de créer le contrat';
          this.submitting = false;
        }
      });
    }
  }

  formatDateForInput(dateString: string | undefined | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
}
