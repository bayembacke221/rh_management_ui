import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RapportsService } from '../../../services/services/rapports.service';
import { SalaryCostReportDto } from '../../../services/models/salary-cost-report-dto';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-salary-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './salary-report.component.html'
})
export class SalaryReportComponent implements OnInit {
  // Filtres
  filterForm: FormGroup;
  currentYear = new Date().getFullYear();

  // Données du rapport
  report: SalaryCostReportDto | null = null;

  // États UI
  loading = false;
  error: string | null = null;

  constructor(
    private rapportsService: RapportsService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      year: [this.currentYear]
    });
  }

  ngOnInit(): void {
    this.loadReport();

    // Surveiller les changements de filtre
    this.filterForm.get('year')?.valueChanges.subscribe(() => {
      this.loadReport();
    });
  }

  loadReport(): void {
    this.loading = true;
    this.error = null;
    const year = this.filterForm.get('year')?.value;

    this.rapportsService.getSalaryCostReport({ year })
      .subscribe({
        next: (data) => {
          this.report = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement du rapport de coûts salariaux', err);
          this.error = 'Impossible de charger les données du rapport';
          this.loading = false;
        }
      });
  }

  downloadReport(): void {
    const year = this.filterForm.get('year')?.value;
    const format = 'PDF'; // Format par défaut

    this.loading = true;

    this.rapportsService.generateReport({
      reportType: 'salary',
      year: year,
      format: format
    }).subscribe({
      next: (response) => {
        this.loading = false;

        if (response) {
          const link = document.createElement('a');
          link.href = response;
          link.download = `rapport-salaires-${year}.${format.toLowerCase()}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la génération du rapport', err);
        this.error = 'Impossible de générer le rapport de coûts salariaux';
        this.loading = false;
      }
    });
  }

  // Méthodes d'assistance pour le template
  getMonthName(month: number): string {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return monthNames[month - 1] || '';
  }

  formatMontant(montant: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  }

  getMaxMonthlyCost(): number {
    if (!this.report?.monthlyCosts) return 0;
    return Math.max(...this.report.monthlyCosts.map(m => m.totalCost || 0));
  }

  getBarHeight(cost: number): string {
    const max = this.getMaxMonthlyCost();
    if (max === 0) return '0%';
    const percentage = (cost / max) * 100;
    return `${percentage}%`;
  }

  getColorForPercentage(percentage: number): string {
    if (percentage > 0.3) return 'bg-red-600';
    if (percentage > 0.2) return 'bg-orange-600';
    if (percentage > 0.1) return 'bg-yellow-600';
    return 'bg-green-600';
  }
}
