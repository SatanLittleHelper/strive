import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { CalorieApiService } from './calorie-api.service';
import { Gender } from '../models/calorie-data.types';
import type {
  BasicData,
  CalorieCalculationData,
  CalorieResults,
  Macronutrients,
} from '../models/calorie-data.types';

describe('CalorieApiService', () => {
  let service: CalorieApiService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

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
    const localStorageMock = {
      getItem: jasmine.createSpy('getItem'),
      setItem: jasmine.createSpy('setItem'),
      removeItem: jasmine.createSpy('removeItem'),
      clear: jasmine.createSpy('clear'),
      length: 0,
      key: jasmine.createSpy('key'),
    };

    localStorageSpy = localStorageMock as jasmine.SpyObj<Storage>;
    spyOnProperty(window, 'localStorage').and.returnValue(localStorageSpy);

    configureZonelessTestingModule({
      providers: [CalorieApiService],
    });

    TestBed.runInInjectionContext(() => {
      service = TestBed.inject(CalorieApiService);
    });
  });

  afterEach(() => {
    localStorageSpy.getItem.calls.reset();
    localStorageSpy.setItem.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calculateCalories', () => {
    it('should calculate calories, save to localStorage and handle different genders', (done) => {
      service.calculateCalories(mockCalorieCalculationData).subscribe({
        next: (results) => {
          expect(results.formula).toBe('mifflin');
          expect(localStorageSpy.setItem).toHaveBeenCalledWith(
            'calorie_calculation',
            jasmine.any(String),
          );

          const femaleData = { ...mockCalorieCalculationData, gender: Gender.FEMALE };
          service.calculateCalories(femaleData).subscribe({
            next: (femaleResults) => {
              expect(femaleResults.bmr).not.toBe(results.bmr);
              done();
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });
  });

  describe('getCaloriesResult', () => {
    it('should return stored calculation when available', (done) => {
      const storedData = { data: mockCalorieCalculationData, results: mockCalorieResults };
      localStorageSpy.getItem.and.returnValue(JSON.stringify(storedData));

      service.getCaloriesResult().subscribe({
        next: (result) => {
          expect(result).toEqual(storedData);
          expect(localStorageSpy.getItem).toHaveBeenCalledWith('calorie_calculation');
          done();
        },
        error: done.fail,
      });
    });

    it('should return null when no stored calculation', (done) => {
      localStorageSpy.getItem.and.returnValue(null);

      service.getCaloriesResult().subscribe({
        next: (result) => {
          expect(result).toBeNull();
          expect(localStorageSpy.getItem).toHaveBeenCalledWith('calorie_calculation');
          done();
        },
        error: done.fail,
      });
    });

    it('should handle invalid JSON in localStorage', (done) => {
      localStorageSpy.getItem.and.returnValue('invalid-json');

      service.getCaloriesResult().subscribe({
        next: (result) => {
          expect(result).toBeNull();
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('calculateBMRMifflin (private method)', () => {
    it('should calculate BMR correctly for both genders', () => {
      const maleResult = (
        service as unknown as { calculateBMRMifflin: (data: BasicData) => number }
      ).calculateBMRMifflin(mockBasicData);
      const femaleData = { ...mockBasicData, gender: Gender.FEMALE };
      const femaleResult = (
        service as unknown as { calculateBMRMifflin: (data: BasicData) => number }
      ).calculateBMRMifflin(femaleData);

      expect(maleResult).toBe(10 * 80 + 6.25 * 180 - 5 * 30 + 5);
      expect(femaleResult).toBe(10 * 80 + 6.25 * 180 - 5 * 30 - 161);
      expect(maleResult).not.toBe(femaleResult);
    });
  });

  describe('calculateTDEE (private method)', () => {
    it('should calculate TDEE correctly for different activity levels', () => {
      const bmr = 1800;

      expect(
        (
          service as unknown as { calculateTDEE: (bmr: number, activity: string) => number }
        ).calculateTDEE(bmr, 'sedentary'),
      ).toBe(Math.round(bmr * 1.2));
      expect(
        (
          service as unknown as { calculateTDEE: (bmr: number, activity: string) => number }
        ).calculateTDEE(bmr, 'moderately_active'),
      ).toBe(Math.round(bmr * 1.55));

      expect(
        (
          service as unknown as { calculateTDEE: (bmr: number, activity: string) => number }
        ).calculateTDEE(bmr, 'unknown_activity'),
      ).toBe(Math.round(bmr * 1.2));
    });
  });

  describe('calculateTargetCalories (private method)', () => {
    it('should calculate target calories for different goals', () => {
      const tdee = 2000;

      expect(
        (
          service as unknown as { calculateTargetCalories: (tdee: number, goal: string) => number }
        ).calculateTargetCalories(tdee, 'lose_weight'),
      ).toBe(Math.round(tdee * 0.8));
      expect(
        (
          service as unknown as { calculateTargetCalories: (tdee: number, goal: string) => number }
        ).calculateTargetCalories(tdee, 'maintain_weight'),
      ).toBe(tdee);
      expect(
        (
          service as unknown as { calculateTargetCalories: (tdee: number, goal: string) => number }
        ).calculateTargetCalories(tdee, 'gain_weight'),
      ).toBe(Math.round(tdee * 1.15));

      expect(
        (
          service as unknown as { calculateTargetCalories: (tdee: number, goal: string) => number }
        ).calculateTargetCalories(tdee, 'unknown_goal'),
      ).toBe(tdee);
    });
  });

  describe('Real application flow', () => {
    it('should save and load calculation with correct goal', (done) => {
      const testData: CalorieCalculationData = {
        gender: Gender.FEMALE,
        age: 25,
        height: 165,
        weight: 60,
        activityLevel: 'lightly_active',
        goal: 'lose_weight', // Явно указываем цель потери веса
      };

      // Рассчитываем калории
      service.calculateCalories(testData).subscribe({
        next: (results) => {
          // Проверяем, что targetCalories меньше TDEE для потери веса
          expect(results.targetCalories).toBeLessThan(results.tdee);

          // Проверяем, что данные сохранены
          expect(localStorageSpy.setItem).toHaveBeenCalled();

          // Теперь загружаем сохраненные данные
          const savedData = localStorageSpy.setItem.calls.mostRecent().args[1];
          const parsedData = JSON.parse(savedData);

          // Проверяем, что цель сохранилась правильно
          expect(parsedData.data.goal).toBe('lose_weight');
          expect(parsedData.results.targetCalories).toBeLessThan(parsedData.results.tdee);

          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Goal-based calculations', () => {
    it('should give different target calories for different goals', (done) => {
      const baseData: CalorieCalculationData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 80,
        activityLevel: 'moderately_active',
        goal: 'maintain_weight',
      };

      // Сначала рассчитываем для поддержания веса
      service.calculateCalories(baseData).subscribe({
        next: (maintainResults) => {
          expect(maintainResults.targetCalories).toBe(maintainResults.tdee);

          // Теперь рассчитываем для потери веса
          const loseWeightData: CalorieCalculationData = { ...baseData, goal: 'lose_weight' };
          service.calculateCalories(loseWeightData).subscribe({
            next: (loseResults) => {
              expect(loseResults.targetCalories).toBeLessThan(loseResults.tdee);
              expect(loseResults.targetCalories).toBe(Math.round(loseResults.tdee * 0.8)); // -20%

              // Теперь рассчитываем для набора веса
              const gainWeightData: CalorieCalculationData = { ...baseData, goal: 'gain_weight' };
              service.calculateCalories(gainWeightData).subscribe({
                next: (gainResults) => {
                  expect(gainResults.targetCalories).toBeGreaterThan(gainResults.tdee);
                  expect(gainResults.targetCalories).toBe(Math.round(gainResults.tdee * 1.15)); // +15%

                  // Проверяем, что все три результата разные
                  expect(maintainResults.targetCalories).not.toBe(loseResults.targetCalories);
                  expect(maintainResults.targetCalories).not.toBe(gainResults.targetCalories);
                  expect(loseResults.targetCalories).not.toBe(gainResults.targetCalories);

                  done();
                },
                error: done.fail,
              });
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });
  });

  describe('saveCalculation (private method)', () => {
    it('should save calculation data to localStorage', () => {
      (
        service as unknown as {
          saveCalculation: (data: CalorieCalculationData, results: CalorieResults) => void;
        }
      ).saveCalculation(mockCalorieCalculationData, mockCalorieResults);

      expect(localStorageSpy.setItem).toHaveBeenCalledWith(
        'calorie_calculation',
        JSON.stringify({
          data: mockCalorieCalculationData,
          results: mockCalorieResults,
        }),
      );
    });

    it('should handle complex data structures', () => {
      const complexData = {
        ...mockCalorieCalculationData,
        age: 25,
        weight: 75.5,
        height: 175.2,
      };

      const complexResults = {
        ...mockCalorieResults,
        bmr: 1750.123,
        tdee: 2712.456,
        targetCalories: 2712.456,
      };

      (
        service as unknown as {
          saveCalculation: (data: CalorieCalculationData, results: CalorieResults) => void;
        }
      ).saveCalculation(complexData, complexResults);

      expect(localStorageSpy.setItem).toHaveBeenCalledWith(
        'calorie_calculation',
        JSON.stringify({
          data: complexData,
          results: complexResults,
        }),
      );
    });
  });

  describe('Integration tests', () => {
    it('should calculate complete calorie calculation flow for all goals', (done) => {
      const baseData = {
        gender: Gender.FEMALE,
        age: 25,
        height: 165,
        weight: 60,
        activityLevel: 'lightly_active' as const,
      };

      // Тестируем все цели в одном тесте
      const goals = ['lose_weight', 'maintain_weight', 'gain_weight'] as const;
      let completedGoals = 0;

      goals.forEach((goal) => {
        const testData: CalorieCalculationData = { ...baseData, goal };

        service.calculateCalories(testData).subscribe({
          next: (results) => {
            expect(results.formula).toBe('mifflin');
            expect(localStorageSpy.setItem).toHaveBeenCalled();

            // Проверяем логику для каждой цели
            if (goal === 'lose_weight') {
              expect(results.targetCalories).toBeLessThan(results.tdee);
            } else if (goal === 'gain_weight') {
              expect(results.targetCalories).toBeGreaterThan(results.tdee);
            } else {
              expect(results.targetCalories).toBe(results.tdee);
            }

            completedGoals++;
            if (completedGoals === goals.length) {
              done();
            }
          },
          error: done.fail,
        });
      });
    });

    it('should handle multiple calculations and storage', (done) => {
      const firstData = { ...mockCalorieCalculationData, age: 30 };
      const secondData = { ...mockCalorieCalculationData, age: 35 };

      // Первый расчет
      service.calculateCalories(firstData).subscribe({
        next: (firstResults) => {
          expect(firstResults).toBeDefined();

          // Второй расчет (перезаписывает первый)
          service.calculateCalories(secondData).subscribe({
            next: (secondResults) => {
              expect(secondResults).toBeDefined();
              expect(localStorageSpy.setItem).toHaveBeenCalledTimes(2);
              done();
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });
  });

  describe('Macronutrients calculation', () => {
    it('should calculate macronutrients for different activity levels and goals', (done) => {
      const testData: CalorieCalculationData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 80,
        activityLevel: 'moderately_active',
        goal: 'maintain_weight',
      };

      service.calculateCalories(testData).subscribe({
        next: (results) => {
          expect(results.macros).toBeDefined();
          expect(results.macros!.proteinGrams).toBeGreaterThan(0);
          expect(results.macros!.fatGrams).toBeGreaterThan(0);
          expect(results.macros!.carbsGrams).toBeGreaterThan(0);

          // Check that macronutrient calories approximately equal target calories
          const totalMacroCalories =
            results.macros!.proteinGrams * 4 +
            results.macros!.fatGrams * 9 +
            results.macros!.carbsGrams * 4;

          // Allow for rounding differences (±50 calories)
          expect(Math.abs(totalMacroCalories - results.targetCalories)).toBeLessThanOrEqual(50);
          done();
        },
        error: done.fail,
      });
    });

    it('should adjust protein based on activity level', (done) => {
      const baseData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 80,
        goal: 'maintain_weight' as const,
      };

      const sedentaryData: CalorieCalculationData = { ...baseData, activityLevel: 'sedentary' };
      const veryActiveData: CalorieCalculationData = { ...baseData, activityLevel: 'very_active' };

      service.calculateCalories(sedentaryData).subscribe({
        next: (sedentaryResults) => {
          service.calculateCalories(veryActiveData).subscribe({
            next: (activeResults) => {
              // Very active should have higher protein than sedentary
              expect(activeResults.macros!.proteinGrams).toBeGreaterThan(
                sedentaryResults.macros!.proteinGrams,
              );
              done();
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });

    it('should adjust protein based on goal', (done) => {
      const baseData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 80,
        activityLevel: 'moderately_active' as const,
      };

      const loseWeightData: CalorieCalculationData = { ...baseData, goal: 'lose_weight' };
      const gainWeightData: CalorieCalculationData = { ...baseData, goal: 'gain_weight' };

      service.calculateCalories(loseWeightData).subscribe({
        next: (loseResults) => {
          service.calculateCalories(gainWeightData).subscribe({
            next: (gainResults) => {
              // Lose weight should have higher protein than gain weight
              expect(loseResults.macros!.proteinGrams).toBeGreaterThan(
                gainResults.macros!.proteinGrams,
              );
              done();
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });

    it('should adjust fat based on goal', (done) => {
      const baseData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 80,
        activityLevel: 'moderately_active' as const,
      };

      const loseWeightData: CalorieCalculationData = { ...baseData, goal: 'lose_weight' };
      const gainWeightData: CalorieCalculationData = { ...baseData, goal: 'gain_weight' };

      service.calculateCalories(loseWeightData).subscribe({
        next: (loseResults) => {
          service.calculateCalories(gainWeightData).subscribe({
            next: (gainResults) => {
              // Gain weight should have higher fat than lose weight
              expect(gainResults.macros!.fatGrams).toBeGreaterThan(loseResults.macros!.fatGrams);
              done();
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });

    it('should handle negative carbs by adjusting fat and protein', (done) => {
      // Use extreme case that might cause negative carbs
      const extremeData: CalorieCalculationData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 120, // High weight
        activityLevel: 'sedentary', // Low activity
        goal: 'lose_weight', // Calorie deficit
      };

      service.calculateCalories(extremeData).subscribe({
        next: (results) => {
          expect(results.macros).toBeDefined();
          expect(results.macros!.carbsGrams).toBeGreaterThanOrEqual(0);
          expect(results.macros!.proteinGrams).toBeGreaterThanOrEqual(120 * 1.4); // Min 1.4g/kg
          done();
        },
        error: done.fail,
      });
    });

    it('should maintain fat percentage within 20-35% of target calories', (done) => {
      const testData: CalorieCalculationData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 80,
        activityLevel: 'moderately_active',
        goal: 'maintain_weight',
      };

      service.calculateCalories(testData).subscribe({
        next: (results) => {
          const fatCalories = results.macros!.fatGrams * 9;
          const fatPercentage = (fatCalories / results.targetCalories) * 100;

          expect(fatPercentage).toBeGreaterThanOrEqual(20);
          expect(fatPercentage).toBeLessThanOrEqual(35);
          done();
        },
        error: done.fail,
      });
    });
  });

  describe('Lazy migration', () => {
    it('should calculate macros for old stored data without macros', (done) => {
      const oldStoredData = {
        data: mockCalorieCalculationData,
        results: {
          bmr: 1800,
          tdee: 2790,
          targetCalories: 2790,
          formula: 'mifflin',
          // No macros field
        },
      };

      localStorageSpy.getItem.and.returnValue(JSON.stringify(oldStoredData));

      service.getCaloriesResult().subscribe({
        next: (result) => {
          expect(result).toBeDefined();
          expect(result!.results.macros).toBeDefined();
          expect(result!.results.macros!.proteinGrams).toBeGreaterThan(0);
          expect(result!.results.macros!.fatGrams).toBeGreaterThan(0);
          expect(result!.results.macros!.carbsGrams).toBeGreaterThan(0);

          // Should save updated result with macros
          expect(localStorageSpy.setItem).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should not modify data that already has macros', (done) => {
      const storedDataWithMacros = {
        data: mockCalorieCalculationData,
        results: mockCalorieResults,
      };

      localStorageSpy.getItem.and.returnValue(JSON.stringify(storedDataWithMacros));

      service.getCaloriesResult().subscribe({
        next: (result) => {
          expect(result).toEqual(storedDataWithMacros);
          // Should not call setItem for data that already has macros
          expect(localStorageSpy.setItem).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });
  });
});
