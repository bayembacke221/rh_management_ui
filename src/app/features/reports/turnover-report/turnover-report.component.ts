import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RapportsService } from '../../../services/services/rapports.service';
import { TurnoverReportDto } from '../../../services/models/turnover-report-dto';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-turnover-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './turnover-report.component.html'
})
export class TurnoverReportComponent implements OnInit {
  // Filtres
  filterForm: FormGroup;
  currentYear = new Date().getFullYear();

  // Données du rapport
  report: TurnoverReportDto | null = null;

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

    this.rapportsService.getTurnoverReport({ year })
      .subscribe({
        next: (data) => {
          this.report = data;
          this.loading = false;

          // Après chargement, initialiser les graphiques
          setTimeout(() => {
            this.initializeCharts();
          }, 0);
        },
        error: (err) => {
          console.error('Erreur lors du chargement du rapport de turnover', err);
          this.error = 'Impossible de charger les données du rapport';
          this.loading = false;
        }
      });
  }

  initializeCharts(): void {
    if (!this.report) return;

    setTimeout(() => {
      const monthlyBars = document.querySelectorAll('.bg-blue-500.rounded-t');
      const monthlyTurnover = this.report?.monthlyTurnover || [];

      monthlyBars.forEach((bar: Element, index) => {
        if (index >= monthlyTurnover.length) return;
        const turnoverRate = monthlyTurnover[index]?.turnoverRate || 0;

        if (turnoverRate > 0.1) {
          bar.classList.remove('bg-blue-500');
          bar.classList.add('bg-red-500');
        } else if (turnoverRate > 0.05) {
          bar.classList.remove('bg-blue-500');
          bar.classList.add('bg-yellow-500');
        }
      });

      const departmentBars = document.querySelectorAll('.bg-blue-600.rounded-full');
      const departmentTurnover = this.report?.departmentTurnover || [];

      departmentBars.forEach((bar: Element, index) => {
        if (index >= departmentTurnover.length) return;
        const turnoverRate = departmentTurnover[index]?.turnoverRate || 0;

        if (turnoverRate > 0.1) {
          bar.classList.remove('bg-blue-600');
          bar.classList.add('bg-red-600');
        } else if (turnoverRate > 0.05) {
          bar.classList.remove('bg-blue-600');
          bar.classList.add('bg-yellow-600');
        } else {
          bar.classList.remove('bg-blue-600');
          bar.classList.add('bg-green-600');
        }
      });

      const allBars = document.querySelectorAll('.rounded-t, .rounded-full');
      allBars.forEach((bar) => {
        bar.classList.add('transition-all', 'duration-500');
      });

      this.calculateTrends();
    }, 100);
  }

  private calculateTrends(): void {
    if (!this.report?.monthlyTurnover || this.report.monthlyTurnover.length < 2) return;

    // Calculate if turnover is trending up or down
    const lastThreeMonths = this.report.monthlyTurnover
      .slice(-3)
      .filter(m => m.turnoverRate !== undefined && m.turnoverRate !== null);

    if (lastThreeMonths.length < 2) return;

    const firstRate = lastThreeMonths[0].turnoverRate || 0;
    const lastRate = lastThreeMonths[lastThreeMonths.length - 1].turnoverRate || 0;

    // Calculate trend direction and percentage change
    const trend = lastRate > firstRate ? 'up' : 'down';
    const percentChange = Math.abs(((lastRate - firstRate) / firstRate) * 100);

    console.log(`Turnover trend: ${trend}, Change: ${percentChange.toFixed(1)}%`);
  }

  downloadReport(): void {
    const year = this.filterForm.get('year')?.value;
    const format = 'PDF'; // Format par défaut

    this.loading = true;

    this.rapportsService.generateReport({
      reportType: 'turnover',
      year: year,
      format: format
    }).subscribe({
      next: (response) => {
        this.loading = false;

        // Si la réponse est une URL de téléchargement
        if (response) {
          // Créer un lien et cliquer dessus pour télécharger
          const link = document.createElement('a');
          link.href = response;
          link.download = `rapport-turnover-${year}.${format.toLowerCase()}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la génération du rapport', err);
        this.error = 'Impossible de générer le rapport de turnover';
        this.loading = false;
      }
    });
  }

  // Méthodes d'assistance pour le template
  getMaxMonthlyTurnover(): number {
    if (!this.report?.monthlyTurnover) return 0;
    return Math.max(...this.report.monthlyTurnover.map(m => m.turnoverRate || 0));
  }

  getMonthName(month: number): string {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return monthNames[month - 1] || '';
  }

  getBarHeight(turnoverRate: number): string {
    const max = this.getMaxMonthlyTurnover();
    if (max === 0) return '0%';
    const percentage = (turnoverRate / max) * 100;
    return `${percentage}%`;
  }
}
