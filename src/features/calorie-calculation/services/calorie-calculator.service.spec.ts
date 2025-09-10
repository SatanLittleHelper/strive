import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { configureZonelessTestingModule } from '@/test-setup';
import { CalorieApiService } from './calorie-api.service';
import { CalorieCalculatorService } from './calorie-calculator.service';
import { Gender } from '../models/calorie-data.types';
import type {
  BasicData,
  CalorieCalculationData,
  CalorieResults,
  Macronutrients,
} from '../models/calorie-data.types';

describe('CalorieCalculatorService', () => {
  let service: CalorieCalculatorService;
  let apiServiceSpy: jasmine.SpyObj<CalorieApiService>;

  const mockBasicData: BasicData = {
    gender: Gender.MALE,
    age: 30,
    height: 180,
    weight: 80,
  };

  const mockCalorieCalculationData: CalorieCalculationData = {
    ...mockBasicData,
    activityLevel: 'moderately_active',
    goal: 'maintain_weight',
  };

  const mockMacronutrients: Macronutrients = {
    proteinGrams: 128,
    fatGrams: 80,
    carbsGrams: 279,
  };

  const mockCalorieResults: CalorieResults = {
    bmr: 1800,
    tdee: 2790,
    targetCalories: 2790,
    formula: 'mifflin',
    macros: mockMacronutrients,
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('CalorieApiService', [
      'calculateCalories',
      'getCaloriesResult',
    ]);

    configureZonelessTestingModule({
      providers: [CalorieCalculatorService, { provide: CalorieApiService, useValue: spy }],
    });

    TestBed.runInInjectionContext(() => {
      service = TestBed.inject(CalorieCalculatorService);
      apiServiceSpy = TestBed.inject(CalorieApiService) as jasmine.SpyObj<CalorieApiService>;
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have initial caloriesResults as null', () => {
      TestBed.runInInjectionContext(() => {
        expect(service.caloriesResults()).toBeNull();
      });
    });

    it('should have initial isLoading as false', () => {
      TestBed.runInInjectionContext(() => {
        expect(service.isLoading()).toBeFalse();
      });
    });
  });

  describe('fetchCalculateCalories', () => {
    it('should set loading to true, call API, update results and set loading to false', (done) => {
      TestBed.runInInjectionContext(() => {
        apiServiceSpy.calculateCalories.and.returnValue(of(mockCalorieResults));

        expect(service.isLoading()).toBeFalse();
        expect(service.caloriesResults()).toBeNull();

        service.fetchCalculateCalories(mockCalorieCalculationData).subscribe({
          next: () => {
            expect(apiServiceSpy.calculateCalories).toHaveBeenCalledWith(
              mockCalorieCalculationData,
            );
            expect(service.caloriesResults()).toEqual(mockCalorieResults);
            done();
          },
          error: done.fail,
        });
      });
    });

    it('should handle API error and reset loading state', (done) => {
      TestBed.runInInjectionContext(() => {
        const errorMessage = 'API Error';
        apiServiceSpy.calculateCalories.and.returnValue(throwError(() => new Error(errorMessage)));

        expect(service.isLoading()).toBeFalse();
        expect(service.caloriesResults()).toBeNull();

        service.fetchCalculateCalories(mockCalorieCalculationData).subscribe({
          next: () => done.fail('Should have errored'),
          error: (error) => {
            expect(error.message).toBe(errorMessage);
            expect(service.caloriesResults()).toBeNull();
            setTimeout(() => {
              expect(service.isLoading()).toBeFalse();
              done();
            }, 0);
          },
        });
      });
    });

    it('should handle multiple consecutive calls correctly', (done) => {
      TestBed.runInInjectionContext(() => {
        const firstResults: CalorieResults = { ...mockCalorieResults, bmr: 1800 };
        const secondResults: CalorieResults = { ...mockCalorieResults, bmr: 1900 };

        apiServiceSpy.calculateCalories.and.returnValues(of(firstResults), of(secondResults));

        let callCount = 0;
        const totalCalls = 2;

        const makeCall = (data: CalorieCalculationData, expectedResults: CalorieResults): void => {
          service.fetchCalculateCalories(data).subscribe({
            next: () => {
              expect(service.caloriesResults()).toEqual(expectedResults);
              callCount++;

              if (callCount === totalCalls) {
                done();
              }
            },
            error: done.fail,
          });
        };

        makeCall(mockCalorieCalculationData, firstResults);

        const secondData = { ...mockCalorieCalculationData, age: 35 };
        makeCall(secondData, secondResults);
      });
    });

    it('should return void Observable', (done) => {
      TestBed.runInInjectionContext(() => {
        apiServiceSpy.calculateCalories.and.returnValue(of(mockCalorieResults));

        service.fetchCalculateCalories(mockCalorieCalculationData).subscribe({
          next: (result) => {
            expect(result).toBeUndefined();
            done();
          },
          error: done.fail,
        });
      });
    });
  });

  describe('fetchCaloriesResult', () => {
    it('should fetch and update results when data exists', (done) => {
      TestBed.runInInjectionContext(() => {
        const storedData = {
          data: mockCalorieCalculationData,
          results: mockCalorieResults,
        };

        apiServiceSpy.getCaloriesResult.and.returnValue(of(storedData));

        expect(service.caloriesResults()).toBeNull();

        service.fetchCaloriesResult().subscribe({
          next: () => {
            expect(apiServiceSpy.getCaloriesResult).toHaveBeenCalled();

            expect(service.caloriesResults()).toEqual(mockCalorieResults);

            done();
          },
          error: done.fail,
        });
      });
    });

    it('should handle case when no stored data exists', (done) => {
      TestBed.runInInjectionContext(() => {
        apiServiceSpy.getCaloriesResult.and.returnValue(of(null));

        service['_caloriesResults'].set(mockCalorieResults);
        expect(service.caloriesResults()).toEqual(mockCalorieResults);

        service.fetchCaloriesResult().subscribe({
          next: () => {
            expect(apiServiceSpy.getCaloriesResult).toHaveBeenCalled();

            expect(service.caloriesResults()).toEqual(mockCalorieResults);

            done();
          },
          error: done.fail,
        });
      });
    });

    it('should handle API error gracefully', (done) => {
      TestBed.runInInjectionContext(() => {
        const errorMessage = 'Storage Error';
        apiServiceSpy.getCaloriesResult.and.returnValue(throwError(() => new Error(errorMessage)));

        service['_caloriesResults'].set(mockCalorieResults);
        expect(service.caloriesResults()).toEqual(mockCalorieResults);

        service.fetchCaloriesResult().subscribe({
          next: () => {
            done.fail('Should have errored');
          },
          error: (error) => {
            expect(error.message).toBe(errorMessage);

            expect(service.caloriesResults()).toEqual(mockCalorieResults);

            done();
          },
        });
      });
    });

    it('should return void Observable', (done) => {
      TestBed.runInInjectionContext(() => {
        const storedData = {
          data: mockCalorieCalculationData,
          results: mockCalorieResults,
        };

        apiServiceSpy.getCaloriesResult.and.returnValue(of(storedData));

        service.fetchCaloriesResult().subscribe({
          next: (result) => {
            expect(result).toBeUndefined();
            done();
          },
          error: done.fail,
        });
      });
    });
  });

  describe('signals behavior', () => {
    it('should properly update caloriesResults signal', () => {
      TestBed.runInInjectionContext(() => {
        expect(service.caloriesResults()).toBeNull();

        service['_caloriesResults'].set(mockCalorieResults);
        expect(service.caloriesResults()).toEqual(mockCalorieResults);

        service['_caloriesResults'].set(null);
        expect(service.caloriesResults()).toBeNull();
      });
    });

    it('should properly update isLoading signal', () => {
      TestBed.runInInjectionContext(() => {
        expect(service.isLoading()).toBeFalse();

        service['_isLoading'].set(true);
        expect(service.isLoading()).toBeTrue();

        service['_isLoading'].set(false);
        expect(service.isLoading()).toBeFalse();
      });
    });

    it('should provide readonly access to signals', () => {
      TestBed.runInInjectionContext(() => {
        expect(service.caloriesResults).toBeDefined();
        expect(service.isLoading).toBeDefined();

        expect(typeof service.caloriesResults).toBe('function');
        expect(typeof service.isLoading).toBe('function');
      });
    });
  });

  describe('integration with CalorieApiService', () => {
    it('should properly integrate with API service for complete flow', (done) => {
      TestBed.runInInjectionContext(() => {
        apiServiceSpy.calculateCalories.and.returnValue(of(mockCalorieResults));

        const testData: CalorieCalculationData = {
          gender: Gender.FEMALE,
          age: 25,
          height: 165,
          weight: 60,
          activityLevel: 'lightly_active',
          goal: 'lose_weight',
        };

        service.fetchCalculateCalories(testData).subscribe({
          next: () => {
            expect(apiServiceSpy.calculateCalories).toHaveBeenCalledWith(testData);

            expect(service.caloriesResults()).toEqual(mockCalorieResults);

            setTimeout(() => {
              expect(service.isLoading()).toBeFalse();
              done();
            }, 0);
          },
          error: done.fail,
        });
      });
    });

    it('should handle complex data structures correctly', (done) => {
      TestBed.runInInjectionContext(() => {
        const complexData: CalorieCalculationData = {
          gender: Gender.MALE,
          age: 45,
          height: 175.5,
          weight: 85.2,
          activityLevel: 'very_active',
          goal: 'gain_weight',
        };

        const complexResults: CalorieResults = {
          bmr: 1750.123,
          tdee: 3150.456,
          targetCalories: 3623.024,
          formula: 'mifflin',
          macros: mockMacronutrients,
        };

        apiServiceSpy.calculateCalories.and.returnValue(of(complexResults));

        service.fetchCalculateCalories(complexData).subscribe({
          next: () => {
            expect(apiServiceSpy.calculateCalories).toHaveBeenCalledWith(complexData);
            expect(service.caloriesResults()).toEqual(complexResults);

            done();
          },
          error: done.fail,
        });
      });
    });
  });

  describe('error handling edge cases', () => {
    it('should handle empty data gracefully', (done) => {
      TestBed.runInInjectionContext(() => {
        const emptyData = {} as CalorieCalculationData;

        apiServiceSpy.calculateCalories.and.returnValue(of(mockCalorieResults));

        service.fetchCalculateCalories(emptyData).subscribe({
          next: () => {
            expect(apiServiceSpy.calculateCalories).toHaveBeenCalledWith(emptyData);
            expect(service.caloriesResults()).toEqual(mockCalorieResults);

            done();
          },
          error: done.fail,
        });
      });
    });

    it('should handle rapid successive calls', (done) => {
      TestBed.runInInjectionContext(() => {
        const results = [mockCalorieResults, { ...mockCalorieResults, bmr: 1900 }];

        apiServiceSpy.calculateCalories.and.returnValues(of(results[0]), of(results[1]));

        let completedCalls = 0;
        const totalCalls = 2;

        const makeCall = (): void => {
          service.fetchCalculateCalories(mockCalorieCalculationData).subscribe({
            next: () => {
              completedCalls++;
              if (completedCalls === totalCalls) {
                expect(apiServiceSpy.calculateCalories).toHaveBeenCalledTimes(totalCalls);
                expect(service.caloriesResults()).toEqual(results[1]); // Last result should be set
                done();
              }
            },
            error: done.fail,
          });
        };

        makeCall();
        makeCall();
      });
    });
  });
});
