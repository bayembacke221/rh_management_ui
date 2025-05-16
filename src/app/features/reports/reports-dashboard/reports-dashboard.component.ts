import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RapportsService } from '../../../services/services/rapports.service';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './reports-dashboard.component.html'
})
export class ReportsDashboardComponent implements OnInit {
  // Année courante pour les filtres par défaut
  currentYear = new Date().getFullYear();

  // Formulaire pour les filtres généraux
  filterForm: FormGroup;

  // Données du tableau de bord
  dashboardSummary: any = null;

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
    this.loadDashboardSummary();
  }

  loadDashboardSummary(): void {
    this.loading = true;
    this.error = null;

    this.rapportsService.getDashboardSummary()
      .subscribe({
        next: (data) => {
          this.dashboardSummary = data;
          this.loading = false;
        },
        error: (err) => {
          console.error('Erreur lors du chargement du résumé du dashboard', err);
          this.error = 'Impossible de charger les données du tableau de bord';
          this.loading = false;
        }
      });
  }

  generateReport(reportType: string): void {
    const year = this.filterForm.get('year')?.value;
    const format = 'PDF'; // Format par défaut

    this.loading = true;

    this.rapportsService.generateReport({
      reportType: reportType,
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
          link.download = `rapport-${reportType}-${year}.${format.toLowerCase()}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la génération du rapport', err);
        this.error = `Impossible de générer le rapport ${reportType}`;
        this.loading = false;
      }
    });
  }
}
