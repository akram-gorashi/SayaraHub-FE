import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { MasterDataService } from './master-data.service';

describe('MasterDataService', () => {
  let service: MasterDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MasterDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('shares identical master-data requests', () => {
    const query = { pageNumber: 1, pageSize: 50 };

    service.getAll(query).subscribe();
    service.getAll(query).subscribe();

    const request = http.expectOne(
      value => value.url === API_ENDPOINTS.masterData &&
        value.params.get('pageNumber') === '1' &&
        value.params.get('pageSize') === '50',
    );
    request.flush({ success: true, message: 'ok', data: {} });
  });
});
