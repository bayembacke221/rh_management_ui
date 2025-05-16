import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RapportsService } from '../../../services/services/rapports.service';
import { EmployeeDistributionReportDto } from '../../../services/models/employee-distribution-report-dto';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-distribution-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './distribution-report.component.html'
})
export class DistributionReportComponent implements OnInit {
  // Filtres
  filterForm: FormGroup;
  useSpecificDate = false;

  // Données du rapport
  report: EmployeeDistributionReportDto | null = null;

  // États UI
  loading = false;
  error: string | null = null;

  constructor(
    private rapportsService: RapportsService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      referenceDate: [new Date().toISOString().split('T')[0]]
    });
  }

  ngOnInit(): void {
    this.loadReport();
  }

  toggleDateMode(): void {
    this.useSpecificDate = !this.useSpecificDate;
    this.loadReport();
  }

  loadReport(): void {
    this.loading = true;
    this.error = null;

    if (this.useSpecificDate) {
      const referenceDate = this.filterForm.get('referenceDate')?.value;

      if (!referenceDate) {
        this.error = 'Veuillez spécifier une date de référence.';
        this.loading = false;
        return;
      }

      this.rapportsService.getEmployeeDistributionReport({ referenceDate })
        .subscribe({
          next: (data) => {
            this.report = data;
            this.loading = false;
          },
          error: (err) => {
            console.error('Erreur lors du chargement du rapport de distribution', err);
            this.error = 'Impossible de charger les données du rapport pour la date spécifiée.';
            this.loading = false;
          }
        });
    } else {
      this.rapportsService.getCurrentEmployeeDistributionReport()
        .subscribe({
          next: (data) => {
            this.report = data;
            this.loading = false;
          },
          error: (err) => {
            console.error('Erreur lors du chargement du rapport de distribution', err);
            this.error = 'Impossible de charger les données actuelles du rapport.';
            this.loading = false;
          }
        });
    }
  }

  downloadReport(): void {
    const format = 'PDF'; // Format par défaut
    this.loading = true;

    let params: any = {
      reportType: 'distribution',
      format: format
    };

    if (this.useSpecificDate) {
      params.referenceDate = this.filterForm.get('referenceDate')?.value;
    }

    this.rapportsService.generateReport(params).subscribe({
      next: (response) => {
        this.loading = false;

        if (response) {
          const link = document.createElement('a');
          link.href = response;
          link.download = `rapport-distribution-${this.useSpecificDate ? 'date' : 'actuel'}.${format.toLowerCase()}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la génération du rapport', err);
        this.error = 'Impossible de générer le rapport de distribution';
        this.loading = false;
      }
    });
  }

  // Méthodes d'assistance pour le template
  getPercentage(value: number, total: number): string {
    if (!total) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  }

  getBarWidth(value: number, total: number): string {
    if (!total) return '0%';
    return `${((value / total) * 100)}%`;
  }

  formatDepartmentName(name: string | undefined): string {
    return name || 'Non défini';
  }

  // Helper methods to safely access potentially undefined properties
  hasByDepartment(): boolean {
    return !!this.report?.genderDistribution?.byDepartment;
  }

  hasAverageAgeByDepartment(): boolean {
    return !!this.report?.ageDistribution?.averageAgeByDepartment;
  }

  hasAverageSeniorityByDepartment(): boolean {
    return !!this.report?.seniorityDistribution?.averageSeniorityByDepartment;
  }

  // Safe access methods for commonly used properties
  getTotalEmployees(): number {
    return this.report?.totalEmployees || 0;
  }

  getSeniorityDistribution(): any {
    return this.report?.seniorityDistribution || {};
  }

  getAgeDistribution(): any {
    return this.report?.ageDistribution || {};
  }
}
