import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EmployeeService } from '../../../services/services/employee.service';
import { EmployeeDto } from '../../../services/models/employee-dto';
import { EmployeeDocumentsComponent } from '../../documents/employee-documents/employee-documents.component';
import {
  EmployeeContractsComponent
} from '../../contracts/employee-contracts/employee-contracts/employee-contracts.component';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    EmployeeDocumentsComponent,
    EmployeeContractsComponent
  ],
  templateUrl: './employee-detail.component.html',
})
export class EmployeeDetailComponent implements OnInit {
  employeeId!: number;
  employee: EmployeeDto | null = null;
  loading = true;
  error: string | null = null;

  activeTab: 'info' | 'documents' | 'contracts' | 'leaves' = 'info';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.router.navigate(['/employees']);
        return;
      }

      this.employeeId = +id;
      this.loadEmployeeData();
    });
  }

  loadEmployeeData(): void {
    this.loading = true;
    this.error = null;

    this.employeeService.getEmployeeById({ id: this.employeeId })
      .subscribe({
        next: (employee) => {
          this.employee = employee;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement des données de l\'employé', err);
          this.error = 'Impossible de charger les informations de l\'employé';
          this.loading = false;
        }
      });
  }

  setActiveTab(tab: 'info' | 'documents' | 'contracts' | 'leaves'): void {
    this.activeTab = tab;
  }

  formatDate(dateString: string | undefined | null): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  }

  getStatusClass(status: string): string {
    const statusMap: {[key: string]: string} = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'ON_LEAVE': 'bg-yellow-100 text-yellow-800',
      'TERMINATED': 'bg-red-100 text-red-800'
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  }

  getGenderLabel(gender: string): string {
    return gender === 'MALE' ? 'Homme' : 'Femme';
  }
}
