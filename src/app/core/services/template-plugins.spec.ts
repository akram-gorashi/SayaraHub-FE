import { TestBed } from '@angular/core/testing';

import { TemplatePlugins } from './template-plugins';

describe('TemplatePlugins', () => {
  let service: TemplatePlugins;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TemplatePlugins);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
