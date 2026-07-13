import { TestBed } from '@angular/core/testing';

import { TemplatePluginsService } from './template-plugins';

describe('TemplatePluginsService', () => {
  let service: TemplatePluginsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplatePluginsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
