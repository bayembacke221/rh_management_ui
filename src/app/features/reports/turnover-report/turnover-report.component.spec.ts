import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnoverReportComponent } from './turnover-report.component';

describe('TurnoverReportComponent', () => {
  let component: TurnoverReportComponent;
  let fixture: ComponentFixture<TurnoverReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnoverReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TurnoverReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
