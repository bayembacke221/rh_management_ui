import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RapportsService } from '../../../services/services/rapports.service';
import { AbsenteeismReportDto } from '../../../services/models/absenteeism-report-dto';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-absenteeism-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './absenteeism-report.component.html'
})
export class AbsenteeismReportComponent implements OnInit {
  // Filtres
  filterForm: FormGroup;
  currentYear = new Date().getFullYear();
  isPeriodMode = false;

  // Données du rapport
  report: AbsenteeismReportDto | null = null;

  // États UI
  loading = false;
  error: string | null = null;

  constructor(
    private rapportsService: RapportsService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      year: [this.currentYear],
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadReport();

    // Surveiller les changements de filtre
    this.filterForm.get('year')?.valueChanges.subscribe(() => {
      if (!this.isPeriodMode) {
        this.loadReport();
      }
    });
  }

  togglePeriodMode(): void {
    this.isPeriodMode = !this.isPeriodMode;
    if (!this.isPeriodMode) {
      this.loadReport();
    }
  }

  loadReport(): void {
    this.loading = true;
    this.error = null;

    if (this.isPeriodMode) {
      const startDate = this.filterForm.get('startDate')?.value;
      const endDate = this.filterForm.get('endDate')?.value;

      if (!startDate || !endDate) {
        this.error = 'Veuillez spécifier une date de début et de fin.';
        this.loading = false;
        return;
      }

      this.rapportsService.getAbsenteeismReportForPeriod({ startDate, endDate })
        .subscribe({
          next: (data) => {
            this.report = data;
            this.loading = false;
          },
          error: (err) => {
            console.error('Erreur lors du chargement du rapport d\'absentéisme', err);
            this.error = 'Impossible de charger les données du rapport pour la période spécifiée.';
            this.loading = false;
          }
        });
    } else {
      const year = this.filterForm.get('year')?.value;

      this.rapportsService.getAbsenteeismReport({ year })
        .subscribe({
          next: (data) => {
            this.report = data;
            this.loading = false;
          },
          error: (err) => {
            console.error('Erreur lors du chargement du rapport d\'absentéisme', err);
            this.error = 'Impossible de charger les données du rapport pour l\'année spécifiée.';
            this.loading = false;
          }
        });
    }
  }

  downloadReport(): void {
    const year = this.filterForm.get('year')?.value;
    const format = 'PDF'; // Format par défaut

    this.loading = true;

    let params: any = {
      reportType: 'absenteeism',
      format: format
    };

    if (this.isPeriodMode) {
      params.startDate = this.filterForm.get('startDate')?.value;
      params.endDate = this.filterForm.get('endDate')?.value;
    } else {
      params.year = year;
    }

    this.rapportsService.generateReport(params).subscribe({
      next: (response) => {
        this.loading = false;

        if (response) {
          const link = document.createElement('a');
          link.href = response;
          link.download = `rapport-absenteeism-${this.isPeriodMode ? 'periode' : year}.${format.toLowerCase()}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la génération du rapport', err);
        this.error = 'Impossible de générer le rapport d\'absentéisme';
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

  getMaxAbsenteeismRate(): number {
    if (!this.report?.monthlyAbsenteeism) return 0;
    return Math.max(...this.report.monthlyAbsenteeism.map(m => m.absenteeismRate || 0));
  }

  getBarHeight(absenteeismRate: number): string {
    const max = this.getMaxAbsenteeismRate();
    if (max === 0) return '0%';
    const percentage = (absenteeismRate / max) * 100;
    return `${percentage}%`;
  }
}
