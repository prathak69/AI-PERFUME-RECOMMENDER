import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfumeDetail } from './perfume-detail';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

describe('PerfumeDetail', () => {
  let component: PerfumeDetail;
  let fixture: ComponentFixture<PerfumeDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfumeDetail],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfumeDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
