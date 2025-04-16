import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CongesService } from '../../../services/services/conges.service';
import { LeaveDto } from '../../../services/models/leave-dto';

@Component({
  selector: 'app-leave-calendar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './leave-calendar.component.html',
})
export class LeaveCalendarComponent implements OnInit {
  leaves: LeaveDto[] = [];
  calendarDays: any[] = [];
  calendarEvents: any = {};

  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  loading = true;
  error: string | null = null;

  constructor(private congesService: CongesService) {}

  ngOnInit(): void {
    this.loadLeaves();
  }

  loadLeaves(): void {
    this.loading = true;
    this.error = null;

    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);

    this.congesService.getLeavesInPeriod({
      startDate: this.formatDateForApi(firstDay),
      endDate: this.formatDateForApi(lastDay)
    }).subscribe({
      next: (leaves) => {
        this.leaves = leaves;
        this.buildCalendar();
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des congés', error);
        this.error = 'Impossible de charger les congés pour cette période';
        this.loading = false;
      }
    });
  }

  buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const numDays = lastDay.getDate();

    // Jours du calendrier
    this.calendarDays = [];

    // Ajouter les jours vides au début pour le décalage du premier jour du mois
    let startingDayOfWeek = firstDay.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
    if (startingDayOfWeek === 0) startingDayOfWeek = 7; // Traiter le dimanche comme jour 7

    for (let i = 1; i < startingDayOfWeek; i++) {
      this.calendarDays.push({ day: null, isToday: false, isWeekend: false });
    }

    // Ajouter les jours du mois
    const today = new Date();
    for (let day = 1; day <= numDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isToday = date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      this.calendarDays.push({
        day,
        date,
        isToday,
        isWeekend
      });
    }

    // Organiser les événements par jour
    this.calendarEvents = {};

    this.leaves.forEach(leave => {
      if (!leave.startDate || !leave.endDate) return;

      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      // Pour chaque jour de la période de congé
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        // Ne traiter que les jours dans le mois affiché
        if (currentDate.getMonth() === this.currentMonth && currentDate.getFullYear() === this.currentYear) {
          const dayKey = currentDate.getDate().toString();

          if (!this.calendarEvents[dayKey]) {
            this.calendarEvents[dayKey] = [];
          }

          // Ajouter l'événement pour ce jour
          this.calendarEvents[dayKey].push({
            id: leave.id,
            employee: leave.employee,
            type: leave.leaveType,
            status: leave.status,
            halfDay: leave.halfDay && (
              currentDate.getTime() === startDate.getTime() ||
              currentDate.getTime() === endDate.getTime()
            )
          });
        }

        // Passer au jour suivant
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.loadLeaves();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.loadLeaves();
  }

  formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getLeaveTypeColor(type: string): string {
    const colorMap: { [key: string]: string } = {
      'ANNUAL_LEAVE': 'bg-blue-100 text-blue-800',
      'SICK_LEAVE': 'bg-red-100 text-red-800',
      'MATERNITY_LEAVE': 'bg-pink-100 text-pink-800',
      'PATERNITY_LEAVE': 'bg-purple-100 text-purple-800',
      'UNPAID_LEAVE': 'bg-yellow-100 text-yellow-800',
      'BEREAVEMENT_LEAVE': 'bg-gray-100 text-gray-800',
      'MARRIAGE_LEAVE': 'bg-indigo-100 text-indigo-800',
      'TRAINING_LEAVE': 'bg-green-100 text-green-800',
      'SABBATICAL_LEAVE': 'bg-orange-100 text-orange-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  }

  getShortLeaveType(type: string): string {
    const typeMap: { [key: string]: string } = {
      'ANNUAL_LEAVE': 'CP',
      'SICK_LEAVE': 'M',
      'MATERNITY_LEAVE': 'MAT',
      'PATERNITY_LEAVE': 'PAT',
      'UNPAID_LEAVE': 'SS',
      'BEREAVEMENT_LEAVE': 'DC',
      'MARRIAGE_LEAVE': 'MR',
      'TRAINING_LEAVE': 'FOR',
      'SABBATICAL_LEAVE': 'SAB',
      'OTHER': 'AUT'
    };
    return typeMap[type] || type;
  }
}
