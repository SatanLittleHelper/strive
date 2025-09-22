import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import type { User, UpdateThemeRequest, UpdateThemeResponse } from '@/shared/lib/types';
import { configureZonelessTestingModule } from '@/test-setup';
import { UserApiService } from './user-api.service';

describe('UserApiService', () => {
  let service: UserApiService;
  let httpClient: jasmine.SpyObj<HttpClient>;
  let mockUser: User;
  let mockThemeResponse: UpdateThemeResponse;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'put']);

    configureZonelessTestingModule({
      providers: [UserApiService, { provide: HttpClient, useValue: httpSpy }],
    });

    service = TestBed.inject(UserApiService);
    httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    mockUser = { id: '1', email: 'test@example.com', theme: 'light' };
    mockThemeResponse = { message: 'Theme updated successfully', theme: 'dark' };
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMe$', () => {
    it('should return user data', () => {
      httpClient.get.and.returnValue(of(mockUser));

      service.getMe$().subscribe((result) => {
        expect(result).toEqual(mockUser);
      });

      expect(httpClient.get).toHaveBeenCalledWith(`${service['baseUrl']}me`);
    });
  });

  describe('updateTheme$', () => {
    it('should update user theme', () => {
      const themeRequest: UpdateThemeRequest = { theme: 'dark' };
      httpClient.put.and.returnValue(of(mockThemeResponse));

      service.updateTheme$(themeRequest).subscribe((result) => {
        expect(result).toEqual(mockThemeResponse);
      });

      expect(httpClient.put).toHaveBeenCalledWith(`${service['baseUrl']}theme`, themeRequest);
    });
  });
});
