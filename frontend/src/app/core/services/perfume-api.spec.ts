import { TestBed } from '@angular/core/testing';
import { PerfumeService } from './perfume-api';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('PerfumeService', () => {
  let service: PerfumeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PerfumeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
