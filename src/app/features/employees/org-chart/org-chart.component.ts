import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrganisationService } from '../../../services/services/organisation.service';
import { DepartementsService } from '../../../services/services/departements.service';
import { DepartementDto } from '../../../services/models/departement-dto';

interface OrgNode {
  id: number;
  name: string;
  title: string;
  department: string;
  img: string;
  children: OrgNode[];
  expanded?: boolean;
}

@Component({
  selector: 'app-org-chart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './org-chart.component.html',
  styleUrl: './org-chart.component.css'
})
export class OrgChartComponent implements OnInit {
  orgChartData: OrgNode[] = [];
  originalData: OrgNode[] = [];
  departments: DepartementDto[] = [];

  // Filtres
  selectedDepartment: string = '';
  expandAll: boolean = false;

  loading: boolean = true;
  error: string | null = null;

  constructor(
    private organisationService: OrganisationService,
    private departmentsService: DepartementsService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadOrgChart();
  }

  loadDepartments(): void {
    const pageable = { page: 0, size: 100, sort: ['name,asc'] };

    this.departmentsService.getAllDepartements({arg0: pageable }).subscribe({
      next: (departments) => {
        this.departments = departments?.content || [];
      },
      error: (error) => {
        console.error('Erreur lors du chargement des départements', error);
      }
    });
  }

  loadOrgChart(): void {
    this.loading = true;
    this.error = null;

    this.organisationService.getOrganizationChart({}).subscribe({
      next: (data) => {
        this.originalData = this.transformData(data);
        this.orgChartData = [...this.originalData];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'organigramme', error);
        this.error = 'Impossible de charger l\'organigramme. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  transformData(data: any[]): OrgNode[] {
    return data.map(item => ({
      id: item.id,
      name: `${item.firstName} ${item.lastName}`,
      title: item.position?.title || 'Non défini',
      department: item.departement?.name || 'Non défini',
      img: `https://ui-avatars.com/api/?name=${item.firstName}+${item.lastName}&background=0D8ABC&color=fff`,
      children: item.subordinates ? this.transformData(item.subordinates) : [],
      expanded: false
    }));
  }

  toggleNode(node: OrgNode): void {
    node.expanded = !node.expanded;
  }

  expandAllNodes(expand: boolean): void {
    this.expandAll = expand;
    this.setExpandedStatus(this.orgChartData, expand);
  }

  setExpandedStatus(nodes: OrgNode[], expanded: boolean): void {
    nodes.forEach(node => {
      node.expanded = expanded;
      if (node.children && node.children.length > 0) {
        this.setExpandedStatus(node.children, expanded);
      }
    });
  }

  applyFilters(): void {
    if (!this.selectedDepartment) {
      this.orgChartData = [...this.originalData];
      return;
    }

    // Filtrer l'organigramme par département
    this.orgChartData = this.filterByDepartment(this.originalData, this.selectedDepartment);
  }

  filterByDepartment(nodes: OrgNode[], departmentId: string): OrgNode[] {
    return nodes.filter(node => {
      // Garder ce nœud si son département correspond
      const nodeMatches = node.department === departmentId;

      // Filtrer les enfants récursivement
      const filteredChildren = this.filterByDepartment(node.children, departmentId);

      // Garder ce nœud si au moins un enfant correspond
      const childrenMatch = filteredChildren.length > 0;

      // Mettre à jour les enfants du nœud
      if (childrenMatch) {
        node.children = filteredChildren;
      }

      // Garder ce nœud s'il correspond ou si ses enfants correspondent
      return nodeMatches || childrenMatch;
    });
  }

  resetFilters(): void {
    this.selectedDepartment = '';
    this.orgChartData = [...this.originalData];
  }
}
