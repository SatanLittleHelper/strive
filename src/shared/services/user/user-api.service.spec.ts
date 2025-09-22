import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { User } from '@/shared/lib/types';
import { configureZonelessTestingModule } from '@/test-setup';
import { UserApiService } from './user-api.service';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpClient', ['get']);

    configureZonelessTestingModule({
      providers: [UserApiService, { provide: HttpClient, useValue: httpSpy }],
    });

    service = TestBed.inject(UserApiService);
    httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMe$', () => {
    it('should return user data', () => {
      const user: User = { id: '1', email: 'test@example.com' };
      httpClient.get.and.returnValue(of(user));

      service.getMe$().subscribe((result) => {
        expect(result).toEqual(user);
      });

      expect(httpClient.get).toHaveBeenCalledWith(`${service['baseUrl']}me`);
    });
  });
});
