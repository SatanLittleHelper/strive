import { TestBed } from '@angular/core/testing';
import type { Macronutrients } from '@/entities/macronutrients';
import { configureZonelessTestingModule } from '@/test-setup';
import { CalorieApiService } from './calorie-api.service';
import { Gender } from '../models/calorie-data.types';
import type {
  BasicData,
  CalorieCalculationData,
  CalorieResults,
} from '../models/calorie-data.types';

describe('CalorieApiService', () => {
  let service: CalorieApiService;
  let localStorageSpy: jasmine.SpyObj<Storage>;

  const TEST_CONSTANTS = {
    MALE_AGE: 30,
    MALE_HEIGHT: 180,
    MALE_WEIGHT: 80,
    FEMALE_AGE: 25,
    FEMALE_HEIGHT: 165,
    FEMALE_WEIGHT: 60,
    BMR: 1800,
    TDEE: 2790,
    TARGET_CALORIES: 2790,
    PROTEIN_GRAMS: 128,
    FAT_GRAMS: 80,
    CARBS_GRAMS: 279,
    PROTEIN_PERCENTAGE: 18.3,
    FAT_PERCENTAGE: 25.8,
    CARBS_PERCENTAGE: 40.0,
    HIGH_WEIGHT: 120,
    COMPLEX_AGE: 25,
    COMPLEX_WEIGHT: 75.5,
    COMPLEX_HEIGHT: 175.2,
    COMPLEX_BMR: 1750.123,
    COMPLEX_TDEE: 2712.456,
    COMPLEX_TARGET_CALORIES: 2712.456,
    CALORIE_TOLERANCE: 50,
    PERCENTAGE_TOLERANCE_MIN: 99,
    PERCENTAGE_TOLERANCE_MAX: 101,
    MIN_PROTEIN_PER_KG: 1.4,
    MIN_FAT_PERCENTAGE: 20,
    MAX_FAT_PERCENTAGE: 35,
  } as const;

  const createMockBasicData = (overrides: Partial<BasicData> = {}): BasicData => ({
    gender: Gender.MALE,
    age: TEST_CONSTANTS.MALE_AGE,
    height: TEST_CONSTANTS.MALE_HEIGHT,
    weight: TEST_CONSTANTS.MALE_WEIGHT,
    ...overrides,
  });

  const createMockCalorieCalculationData = (
    overrides: Partial<CalorieCalculationData> = {},
  ): CalorieCalculationData => ({
    ...createMockBasicData(),
    activityLevel: 'moderately_active',
    goal: 'maintain_weight',
    ...overrides,
  });

  const createMockMacronutrients = (overrides: Partial<Macronutrients> = {}): Macronutrients => ({
    proteinGrams: TEST_CONSTANTS.PROTEIN_GRAMS,
    fatGrams: TEST_CONSTANTS.FAT_GRAMS,
    carbsGrams: TEST_CONSTANTS.CARBS_GRAMS,
    proteinPercentage: TEST_CONSTANTS.PROTEIN_PERCENTAGE,
    fatPercentage: TEST_CONSTANTS.FAT_PERCENTAGE,
    carbsPercentage: TEST_CONSTANTS.CARBS_PERCENTAGE,
    ...overrides,
  });

  const createMockCalorieResults = (overrides: Partial<CalorieResults> = {}): CalorieResults => ({
    bmr: TEST_CONSTANTS.BMR,
    tdee: TEST_CONSTANTS.TDEE,
    targetCalories: TEST_CONSTANTS.TARGET_CALORIES,
    formula: 'mifflin',
    macros: createMockMacronutrients(),
    ...overrides,
  });

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
      const testData = createMockCalorieCalculationData();
      service.calculateCalories(testData).subscribe({
        next: (results) => {
          expect(results.formula).toBe('mifflin');
          expect(localStorageSpy.setItem).toHaveBeenCalledWith(
            'calorie_calculation',
            jasmine.any(String),
          );

          const femaleData = createMockCalorieCalculationData({ gender: Gender.FEMALE });
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
      const testData = createMockCalorieCalculationData();
      const testResults = createMockCalorieResults();
      const storedData = { data: testData, results: testResults };
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
      const maleData = createMockBasicData();
      const femaleData = createMockBasicData({ gender: Gender.FEMALE });

      const maleResult = (
        service as unknown as { calculateBMRMifflin: (data: BasicData) => number }
      ).calculateBMRMifflin(maleData);
      const femaleResult = (
        service as unknown as { calculateBMRMifflin: (data: BasicData) => number }
      ).calculateBMRMifflin(femaleData);

      expect(maleResult).toBe(
        10 * TEST_CONSTANTS.MALE_WEIGHT +
          6.25 * TEST_CONSTANTS.MALE_HEIGHT -
          5 * TEST_CONSTANTS.MALE_AGE +
          5,
      );
      expect(femaleResult).toBe(
        10 * TEST_CONSTANTS.MALE_WEIGHT +
          6.25 * TEST_CONSTANTS.MALE_HEIGHT -
          5 * TEST_CONSTANTS.MALE_AGE -
          161,
      );
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
        goal: 'lose_weight',
      };

      service.calculateCalories(testData).subscribe({
        next: (results) => {
          expect(results.targetCalories).toBeLessThan(results.tdee);

          expect(localStorageSpy.setItem).toHaveBeenCalled();

          const savedData = localStorageSpy.setItem.calls.mostRecent().args[1];
          const parsedData = JSON.parse(savedData);

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

      service.calculateCalories(baseData).subscribe({
        next: (maintainResults) => {
          expect(maintainResults.targetCalories).toBe(maintainResults.tdee);

          const loseWeightData: CalorieCalculationData = { ...baseData, goal: 'lose_weight' };
          service.calculateCalories(loseWeightData).subscribe({
            next: (loseResults) => {
              expect(loseResults.targetCalories).toBeLessThan(loseResults.tdee);
              expect(loseResults.targetCalories).toBe(Math.round(loseResults.tdee * 0.8));

              const gainWeightData: CalorieCalculationData = { ...baseData, goal: 'gain_weight' };
              service.calculateCalories(gainWeightData).subscribe({
                next: (gainResults) => {
                  expect(gainResults.targetCalories).toBeGreaterThan(gainResults.tdee);
                  expect(gainResults.targetCalories).toBe(Math.round(gainResults.tdee * 1.15));

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
      ).saveCalculation(createMockCalorieCalculationData(), createMockCalorieResults());

      expect(localStorageSpy.setItem).toHaveBeenCalledWith(
        'calorie_calculation',
        JSON.stringify({
          data: createMockCalorieCalculationData(),
          results: createMockCalorieResults(),
        }),
      );
    });

    it('should handle complex data structures', () => {
      const complexData = {
        ...createMockCalorieCalculationData(),
        age: 25,
        weight: 75.5,
        height: 175.2,
      };

      const complexResults = {
        ...createMockCalorieResults(),
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

      const goals = ['lose_weight', 'maintain_weight', 'gain_weight'] as const;
      let completedGoals = 0;

      goals.forEach((goal) => {
        const testData: CalorieCalculationData = { ...baseData, goal };

        service.calculateCalories(testData).subscribe({
          next: (results) => {
            expect(results.formula).toBe('mifflin');
            expect(localStorageSpy.setItem).toHaveBeenCalled();

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
      const firstData = { ...createMockCalorieCalculationData(), age: 30 };
      const secondData = { ...createMockCalorieCalculationData(), age: 35 };

      service.calculateCalories(firstData).subscribe({
        next: (firstResults) => {
          expect(firstResults).toBeDefined();

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
          expect(results.macros.proteinGrams).toBeGreaterThan(0);
          expect(results.macros.fatGrams).toBeGreaterThan(0);
          expect(results.macros.carbsGrams).toBeGreaterThan(0);

          const totalMacroCalories =
            results.macros.proteinGrams * 4 +
            results.macros.fatGrams * 9 +
            results.macros.carbsGrams * 4;

          expect(Math.abs(totalMacroCalories - results.targetCalories)).toBeLessThanOrEqual(50);

          expect(results.macros.proteinPercentage).toBeGreaterThan(0);
          expect(results.macros.fatPercentage).toBeGreaterThan(0);
          expect(results.macros.carbsPercentage).toBeGreaterThan(0);

          const totalPercentage =
            results.macros.proteinPercentage +
            results.macros.fatPercentage +
            results.macros.carbsPercentage;
          expect(totalPercentage).toBeGreaterThanOrEqual(99);
          expect(totalPercentage).toBeLessThanOrEqual(101);
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
              expect(activeResults.macros.proteinGrams).toBeGreaterThan(
                sedentaryResults.macros.proteinGrams,
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
              expect(loseResults.macros.proteinGrams).toBeGreaterThan(
                gainResults.macros.proteinGrams,
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
              expect(gainResults.macros.fatGrams).toBeGreaterThan(loseResults.macros.fatGrams);
              done();
            },
            error: done.fail,
          });
        },
        error: done.fail,
      });
    });

    it('should handle negative carbs by adjusting fat and protein', (done) => {
      const extremeData: CalorieCalculationData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 120,
        activityLevel: 'sedentary',
        goal: 'lose_weight',
      };

      service.calculateCalories(extremeData).subscribe({
        next: (results) => {
          expect(results.macros).toBeDefined();
          expect(results.macros.carbsGrams).toBeGreaterThanOrEqual(0);
          expect(results.macros.proteinGrams).toBeGreaterThanOrEqual(120 * 1.4); // Min 1.4g/kg
          done();
        },
        error: done.fail,
      });
    });

    it('should adjust fat to minimum when carbs are negative and fat exceeds minimum', (done) => {
      const extremeData: CalorieCalculationData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 150, // Very high weight to trigger negative carbs
        activityLevel: 'sedentary',
        goal: 'lose_weight',
      };

      service.calculateCalories(extremeData).subscribe({
        next: (results) => {
          expect(results.macros).toBeDefined();
          expect(results.macros.carbsGrams).toBeGreaterThanOrEqual(0);

          const fatCalories = results.macros.fatGrams * 9;
          const fatPercentage = (fatCalories / results.targetCalories) * 100;

          expect(fatPercentage).toBeGreaterThanOrEqual(20); // MIN_FAT_PERCENTAGE
          done();
        },
        error: done.fail,
      });
    });

    it('should adjust protein to minimum when carbs are negative and protein exceeds minimum', (done) => {
      const extremeData: CalorieCalculationData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 200, // Very high weight to trigger negative carbs
        activityLevel: 'very_active', // High activity for high protein
        goal: 'gain_weight', // High protein goal
      };

      service.calculateCalories(extremeData).subscribe({
        next: (results) => {
          expect(results.macros).toBeDefined();
          expect(results.macros.carbsGrams).toBeGreaterThanOrEqual(0);

          const minProteinGrams = 200 * 1.4; // MIN_PROTEIN_PER_KG * weight
          expect(results.macros.proteinGrams).toBeGreaterThanOrEqual(minProteinGrams);
          done();
        },
        error: done.fail,
      });
    });

    it('should test macronutrients calculation edge cases directly', () => {
      const calculateMacronutrients = (
        service as unknown as {
          calculateMacronutrients: (
            data: CalorieCalculationData,
            targetCalories: number,
          ) => Macronutrients;
        }
      ).calculateMacronutrients;

      const extremeData: CalorieCalculationData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 100, // High weight
        activityLevel: 'very_active', // High activity for high protein
        goal: 'gain_weight', // High protein goal
      };

      const lowCalories = 1000; // Very low calories to trigger negative carbs

      const result = calculateMacronutrients(extremeData, lowCalories);

      expect(result).toBeDefined();
      expect(result.carbsGrams).toBeGreaterThanOrEqual(0);
      expect(result.proteinGrams).toBeGreaterThanOrEqual(100 * 1.4); // MIN_PROTEIN_PER_KG

      const fatCalories = result.fatGrams * 9;
      const fatPercentage = (fatCalories / lowCalories) * 100;
      expect(fatPercentage).toBeGreaterThanOrEqual(19); // Close to MIN_FAT_PERCENTAGE
    });

    it('should handle case when fat and protein are already at minimum levels', () => {
      const calculateMacronutrients = (
        service as unknown as {
          calculateMacronutrients: (
            data: CalorieCalculationData,
            targetCalories: number,
          ) => Macronutrients;
        }
      ).calculateMacronutrients;

      const extremeData: CalorieCalculationData = {
        gender: Gender.MALE,
        age: 30,
        height: 180,
        weight: 50, // Lower weight
        activityLevel: 'sedentary', // Lower activity for lower protein
        goal: 'lose_weight', // Lower protein goal
      };

      const lowCalories = 800; // Very low calories to trigger negative carbs

      const result = calculateMacronutrients(extremeData, lowCalories);

      expect(result).toBeDefined();
      expect(result.carbsGrams).toBeGreaterThanOrEqual(0);
      expect(result.proteinGrams).toBeGreaterThanOrEqual(50 * 1.4); // MIN_PROTEIN_PER_KG

      const fatCalories = result.fatGrams * 9;
      const fatPercentage = (fatCalories / lowCalories) * 100;
      expect(fatPercentage).toBeGreaterThanOrEqual(19); // Close to MIN_FAT_PERCENTAGE
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
          const fatCalories = results.macros.fatGrams * 9;
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
        data: createMockCalorieCalculationData(),
        results: {
          bmr: 1800,
          tdee: 2790,
          targetCalories: 2790,
          formula: 'mifflin',
        },
      };

      localStorageSpy.getItem.and.returnValue(JSON.stringify(oldStoredData));

      service.getCaloriesResult().subscribe({
        next: (result) => {
          expect(result).toBeDefined();
          if (!result) {
            done.fail('Expected result to be defined, but got null');
            return;
          }
          expect(result.results.macros).toBeDefined();
          expect(result.results.macros.proteinGrams).toBeGreaterThan(0);
          expect(result.results.macros.fatGrams).toBeGreaterThan(0);
          expect(result.results.macros.carbsGrams).toBeGreaterThan(0);
          expect(result.results.macros.proteinPercentage).toBeGreaterThan(0);
          expect(result.results.macros.fatPercentage).toBeGreaterThan(0);
          expect(result.results.macros.carbsPercentage).toBeGreaterThan(0);

          expect(localStorageSpy.setItem).toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });

    it('should not modify data that already has macros', (done) => {
      const storedDataWithMacros = {
        data: createMockCalorieCalculationData(),
        results: createMockCalorieResults(),
      };

      localStorageSpy.getItem.and.returnValue(JSON.stringify(storedDataWithMacros));

      service.getCaloriesResult().subscribe({
        next: (result) => {
          expect(result).toEqual(storedDataWithMacros);
          expect(localStorageSpy.setItem).not.toHaveBeenCalled();
          done();
        },
        error: done.fail,
      });
    });
  });
});
