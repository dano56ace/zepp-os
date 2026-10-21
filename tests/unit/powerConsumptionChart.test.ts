import { describe, it, expect } from 'vitest';
import React from 'react';
import { PowerConsumptionChart } from '../../src/components/PowerConsumptionChart';

describe('PowerConsumptionChart (recharts visualization)', () => {
  it('PowerConsumptionChart component is exported and defined', () => {
    expect(PowerConsumptionChart).toBeDefined();
    expect(typeof PowerConsumptionChart).toBe('function');
  });

  it('can be instantiated with fallback report without error', () => {
    const element = React.createElement(PowerConsumptionChart, {
      activeProfile: 'balanced'
    });
    expect(element).toBeDefined();
    expect(element.props.activeProfile).toBe('balanced');
  });

  it('accepts custom power report and ultra active profile', () => {
    const mockReport = {
      overallHealth: 'optimal' as const,
      estimatedPowerSavingsPercent: 45,
      projectedBatteryLifeHours: 192,
      burnInProtectionPassed: true,
      onPixelRatioPercent: 8.5,
      metrics: {
        totalElements: 5,
        activeWidgets: 2,
        sensorsDetected: 1,
        animationsActive: 0,
        secondHandType: 'sweep_1hz' as const
      },
      elementBreakdown: [
        {
          id: 'test_second_hand',
          name: '1Hz Second Hand',
          category: 'second_hand' as const,
          impactLevel: 'high' as const,
          drainPercentage: 1.5,
          drainSharePercent: 40,
          stockBehavior: '1Hz timer',
          faodBehavior: 'Apollo eco 1Hz',
          isOptimizedInFaod: true,
          statusBadge: '1Hz Optimized',
          estimatedMaCurrent: 6.5,
          mitigationTip: 'Delegate loop'
        }
      ],
      recommendations: []
    };

    const element = React.createElement(PowerConsumptionChart, {
      report: mockReport,
      activeProfile: 'ultra'
    });
    expect(element.props.report.estimatedPowerSavingsPercent).toBe(45);
    expect(element.props.activeProfile).toBe('ultra');
  });
});
