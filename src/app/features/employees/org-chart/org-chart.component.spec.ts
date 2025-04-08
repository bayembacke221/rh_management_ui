import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrgChartComponent } from './org-chart.component';

describe('OrgChartComponent', () => {
  let component: OrgChartComponent;
  let fixture: ComponentFixture<OrgChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrgChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrgChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
