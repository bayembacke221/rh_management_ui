import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AbsenteeismReportComponent } from './absenteeism-report.component';

describe('AbsenteeismReportComponent', () => {
  let component: AbsenteeismReportComponent;
  let fixture: ComponentFixture<AbsenteeismReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AbsenteeismReportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AbsenteeismReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
