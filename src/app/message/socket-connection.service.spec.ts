import { TestBed } from '@angular/core/testing';

import { SocketConnectionService } from './socket-connection.service';

describe('SocketConnectionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SocketConnectionService = TestBed.get(SocketConnectionService);
    expect(service).toBeTruthy();
  });
});
