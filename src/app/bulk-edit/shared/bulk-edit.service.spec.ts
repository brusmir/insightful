import { TestBed } from '@angular/core/testing';

import { BulkEditService } from './bulk-edit.service';

describe('BulkEditService', () => {
  let service: BulkEditService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BulkEditService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
