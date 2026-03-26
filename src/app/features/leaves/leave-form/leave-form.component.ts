import { Component, OnInit } from '@angular/core';

import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CongesService } from '../../../services/services/conges.service';
import { SoldesDeCongesService } from '../../../services/services/soldes-de-conges.service';
import { EmployeeService } from '../../../services/services/employee.service';
import { LeaveDto, LeaveBalanceDto, EmployeeDto } from '../../../services/models';
import { LeaveCreateDto } from '../../../services/models/leave-create-dto';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-leave-form',
  standalone: true,
  imports: [RouterModule, ReactiveFormsModule],
  templateUrl: './leave-form.component.html',
})
export class LeaveFormComponent implements OnInit {
  leaveForm: FormGroup;
  isEditMode = false;
  leaveId?: number;
  employeeId?: number;

  employees: EmployeeDto[] = [];
  leaveBalances: LeaveBalanceDto[] = [];
  selectedEmployeeBalances: LeaveBalanceDto[] = [];

  loading = false;
  submitting = false;
  error: string | null = null;
  successMessage: string | null = null;

  leaveTypes = [
    { value: 'ANNUAL_LEAVE', label: 'Congés payés' },
    { value: 'SICK_LEAVE', label: 'Maladie' },
    { value: 'MATERNITY_LEAVE', label: 'Maternité' },
    { value: 'PATERNITY_LEAVE', label: 'Paternité' },
    { value: 'UNPAID_LEAVE', label: 'Sans solde' },
    { value: 'BEREAVEMENT_LEAVE', label: 'Décès' },
    { value: 'MARRIAGE_LEAVE', label: 'Mariage' },
    { value: 'TRAINING_LEAVE', label: 'Formation' },
    { value: 'SABBATICAL_LEAVE', label: 'Sabbatique' },
    { value: 'OTHER', label: 'Autre' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private congesService: CongesService,
    private soldesService: SoldesDeCongesService,
    private employeeService: EmployeeService
  ) {
    this.leaveForm = this.createLeaveForm();
  }

  ngOnInit(): void {
    this.loading = true;

    // Déterminer si nous sommes en mode édition
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.leaveId = +id;
        this.loadLeaveData(+id);
      } else {
        this.loadFormData();
      }
    });

    // Surveiller les changements d'employé pour mettre à jour les soldes
    this.leaveForm.get('employeeId')?.valueChanges.subscribe(employeeId => {
      if (employeeId) {
        this.employeeId = +employeeId;
        this.updateEmployeeBalances(+employeeId);
      } else {
        this.selectedEmployeeBalances = [];
      }
    });

    // Calculer la durée quand les dates changent
    this.leaveForm.get('startDate')?.valueChanges.subscribe(() => this.calculateDuration());
    this.leaveForm.get('endDate')?.valueChanges.subscribe(() => this.calculateDuration());
    this.leaveForm.get('halfDay')?.valueChanges.subscribe(() => this.calculateDuration());
  }

  createLeaveForm(): FormGroup {
    const currentYear = new Date().getFullYear();
    return this.fb.group({
      employeeId: ['', Validators.required],
      leaveType: ['ANNUAL_LEAVE', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      halfDay: [false],
      reason: [''],
      attachments: ['']
    });
  }

  loadFormData(): void {
    this.loading = true;

    // Récupération des employés actifs
    this.employeeService.searchEmployees({
      status: 'ACTIVE',
      pageable: { page: 0, size: 1000 }
    }).subscribe({
      next: (response) => {
        this.employees = response.content || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des employés', error);
        this.error = 'Impossible de charger la liste des employés. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  loadLeaveData(leaveId: number): void {
    this.loading = true;

    forkJoin({
      leave: this.congesService.getLeaveById({ id: leaveId }),
      employees: this.employeeService.searchEmployees({
        status: 'ACTIVE',
        pageable: { page: 0, size: 1000 }
      }).pipe(catchError(error => {
        console.error('Erreur lors du chargement des employés', error);
        return of({ content: [] });
      }))
    }).subscribe({
      next: (results) => {
        this.employees = results.employees.content || [];

        const leave = results.leave;
        this.employeeId = leave.employee?.id;

        // Charger les soldes de congés pour cet employé
        if (this.employeeId) {
          this.updateEmployeeBalances(this.employeeId);
        }

        // Pré-remplir le formulaire
        this.leaveForm.patchValue({
          employeeId: leave.employee?.id,
          leaveType: leave.leaveType,
          startDate: this.formatDateForInput(leave.startDate),
          endDate: this.formatDateForInput(leave.endDate),
          halfDay: leave.halfDay,
          reason: leave.reason,
          attachments: leave.attachments
        });

        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des données de congé', error);
        this.error = 'Impossible de charger les données de la demande de congé.';
        this.loading = false;
      }
    });
  }

  updateEmployeeBalances(employeeId: number): void {
    const currentYear = new Date().getFullYear();

    this.soldesService.getEmployeeLeaveBalancesByYear({
      employeeId: employeeId,
      year: currentYear
    }).subscribe({
      next: (balances) => {
        this.selectedEmployeeBalances = balances;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des soldes de congés', error);
        this.selectedEmployeeBalances = [];
      }
    });
  }

  calculateDuration(): void {
    const startDate = this.leaveForm.get('startDate')?.value;
    const endDate = this.leaveForm.get('endDate')?.value;
    const halfDay = this.leaveForm.get('halfDay')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Vérifier que la date de fin est après la date de début
      if (end < start) {
        this.leaveForm.get('endDate')?.setErrors({ invalidEndDate: true });
        return;
      } else {
        this.leaveForm.get('endDate')?.setErrors(null);
      }

      // Vérifier si les dates ne se chevauchent pas avec d'autres congés
      if (this.employeeId) {
        this.congesService.checkOverlappingLeave({
          employeeId: this.employeeId,
          startDate: startDate,
          endDate: endDate,
          excludeLeaveId: this.leaveId
        }).subscribe({
          next: (hasOverlap) => {
            if (hasOverlap) {
              this.leaveForm.get('startDate')?.setErrors({ overlapping: true });
              this.leaveForm.get('endDate')?.setErrors({ overlapping: true });
            }
          }
        });
      }

      // Calculer le nombre de jours ouvrés
      let days = 0;
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Pas de weekend
          days++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Ajustement pour demi-journée
      if (halfDay && days > 0) {
        days -= 0.5;
      }
    }
  }

  onSubmit(): void {
    if (this.leaveForm.invalid) {
      // Marquer tous les champs comme touchés pour afficher les validations
      Object.keys(this.leaveForm.controls).forEach(key => {
        this.leaveForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting = true;
    this.error = null;
    this.successMessage = null;

    const formValue = this.leaveForm.value;

    if (this.isEditMode && this.leaveId) {
      // Mise à jour d'une demande existante
      this.congesService.updateLeave({
        id: this.leaveId,
        body: {
          startDate: formValue.startDate,
          endDate: formValue.endDate,
          halfDay: formValue.halfDay,
          leaveType: formValue.leaveType,
          reason: formValue.reason,
          attachments: formValue.attachments
        }
      }).subscribe({
        next: () => {
          this.successMessage = 'Demande de congé mise à jour avec succès.';
          this.submitting = false;
          // Rediriger après un court délai
          setTimeout(() => {
            this.router.navigate(['/leaves']);
          }, 1500);
        },
        error: (error) => {
          console.error('Erreur lors de la mise à jour de la demande de congé', error);
          this.error = 'Impossible de mettre à jour la demande de congé.';
          this.submitting = false;
        }
      });
    } else {
      // Création d'une nouvelle demande
      const leaveData: LeaveCreateDto = {
        employeeId: formValue.employeeId,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        halfDay: formValue.halfDay,
        leaveType: formValue.leaveType,
        reason: formValue.reason,
        attachments: formValue.attachments
      };

      this.congesService.createLeave({ body: leaveData }).subscribe({
        next: () => {
          this.successMessage = 'Demande de congé créée avec succès.';
          this.submitting = false;
          // Rediriger après un court délai
          setTimeout(() => {
            this.router.navigate(['/leaves']);
          }, 1500);
        },
        error: (error) => {
          console.error('Erreur lors de la création de la demande de congé', error);
          this.error = 'Impossible de créer la demande de congé.';
          this.submitting = false;
        }
      });
    }
  }

  getLeaveBalance(leaveType: string): number {
    const balance = this.selectedEmployeeBalances.find(b => b.leaveType === leaveType);
    return balance ? balance.currentBalance || 0 : 0;
  }

  formatDateForInput(dateString: string | undefined | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
}
