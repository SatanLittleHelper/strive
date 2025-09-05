import { TestBed } from '@angular/core/testing';
import { configureZonelessTestingModule } from '@/test-setup';
import { CalorieFormStateService } from './calorie-form-state.service';
import type { BasicData, ActivityData } from '../models/calorie-data.types';

describe('CalorieFormStateService', () => {
  let service: CalorieFormStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CalorieFormStateService],
    });
    configureZonelessTestingModule();
    service = TestBed.inject(CalorieFormStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should have initial values', () => {
      expect(service.currentStep()).toBe(0);
      expect(service.basicData()).toBeNull();
      expect(service.activityData()).toBeNull();
      expect(service.hasDataChanges()).toBe(true);
    });
  });

  describe('setCurrentStep', () => {
    it('should set current step', () => {
      service.setCurrentStep(2);
      expect(service.currentStep()).toBe(2);
    });
  });

  describe('setBasicData', () => {
    it('should set basic data and move to step 1', () => {
      const basicData: BasicData = {
        age: 25,
        gender: 'male',
        height: 180,
        weight: 75,
      };

      service.setBasicData(basicData);

      expect(service.basicData()).toEqual(basicData);
      expect(service.currentStep()).toBe(1);
      expect(service.hasDataChanges()).toBe(false);
    });
  });

  describe('setActivityData', () => {
    it('should set activity data', () => {
      const activityData: ActivityData = {
        activityLevel: 'moderate',
        goal: 'maintain',
      };

      service.setActivityData(activityData);

      expect(service.activityData()).toEqual(activityData);
      expect(service.hasDataChanges()).toBe(false);
    });
  });

  describe('markDataAsChanged', () => {
    it('should mark data as changed', () => {
      service.markDataAsChanged();
      expect(service.hasDataChanges()).toBe(true);
    });
  });

  describe('resetForm', () => {
    it('should reset all form data', () => {
      const basicData: BasicData = {
        age: 25,
        gender: 'male',
        height: 180,
        weight: 75,
      };
      const activityData: ActivityData = {
        activityLevel: 'moderate',
        goal: 'maintain',
      };

      service.setBasicData(basicData);
      service.setActivityData(activityData);
      service.resetForm();

      expect(service.currentStep()).toBe(0);
      expect(service.basicData()).toBeNull();
      expect(service.activityData()).toBeNull();
      expect(service.hasDataChanges()).toBe(true);
    });
  });

  describe('isActivityTabDisabled', () => {
    it('should return true when basic data is null', () => {
      expect(service.isActivityTabDisabled()).toBe(true);
    });

    it('should return false when basic data is set', () => {
      const basicData: BasicData = {
        age: 25,
        gender: 'male',
        height: 180,
        weight: 75,
      };

      service.setBasicData(basicData);
      expect(service.isActivityTabDisabled()).toBe(false);
    });
  });

  describe('isResultsTabDisabled', () => {
    it('should return true when basic data is null', () => {
      expect(service.isResultsTabDisabled()).toBe(true);
    });

    it('should return true when activity data is null', () => {
      const basicData: BasicData = {
        age: 25,
        gender: 'male',
        height: 180,
        weight: 75,
      };

      service.setBasicData(basicData);
      expect(service.isResultsTabDisabled()).toBe(true);
    });

    it('should return false when both data are set', () => {
      const basicData: BasicData = {
        age: 25,
        gender: 'male',
        height: 180,
        weight: 75,
      };
      const activityData: ActivityData = {
        activityLevel: 'moderate',
        goal: 'maintain',
      };

      service.setBasicData(basicData);
      service.setActivityData(activityData);
      expect(service.isResultsTabDisabled()).toBe(false);
    });
  });
});
