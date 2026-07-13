import { HttpParams } from '@angular/common/http';

import { QueryParams, QueryValue } from '../models/api.models';

export function toHttpParams(query: QueryParams = {}): HttpParams {
  let params = new HttpParams();

  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      continue;
    }

    const values = Array.isArray(rawValue) ? rawValue : [rawValue];
    for (const value of values as Exclude<QueryValue, readonly (string | number)[] | null | undefined>[]) {
      params = params.append(key, value instanceof Date ? value.toISOString() : String(value));
    }
  }

  return params;
}
