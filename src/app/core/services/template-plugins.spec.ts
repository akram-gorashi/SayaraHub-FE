import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { LanguageService } from './language.service';
import { TemplatePluginsService } from './template-plugins';

describe('TemplatePluginsService', () => {
  let service: TemplatePluginsService;

  beforeEach(() => {
    const rtl = signal(false);
    TestBed.configureTestingModule({
      providers: [
        { provide: LanguageService, useValue: { isRtl: () => rtl() } },
      ],
    });
    service = TestBed.inject(TemplatePluginsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
