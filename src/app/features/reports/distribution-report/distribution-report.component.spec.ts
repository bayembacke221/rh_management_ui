import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DistributionReportComponent } from './distribution-report.component';

describe('DistributionReportComponent', () => {
  let component: DistributionReportComponent;
  let fixture: ComponentFixture<DistributionReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DistributionReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DistributionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
