import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfumeDetail } from './perfume-detail';

describe('PerfumeDetail', () => {
  let component: PerfumeDetail;
  let fixture: ComponentFixture<PerfumeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfumeDetail],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfumeDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
