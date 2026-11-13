// The choices the form offers. The catalog, the planner and the tests all read these lists.
export const SESSION_LENGTHS = [15, 30, 45, 60] as const;
export const DAY_COUNTS = [2, 3, 4, 5, 6] as const;
export const GOALS = ['growth', 'definition'] as const;
export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;
export const EQUIPMENT = ['Dumbbells', 'Pull-up Bar', 'Resistance Band', 'TRX', 'Bench'] as const;
export const FOCUS_AREAS = ['Push', 'Pull', 'Legs', 'Core'] as const;

export type DayCount = (typeof DAY_COUNTS)[number];
export type Goal = (typeof GOALS)[number];
export type Level = (typeof LEVELS)[number];
export type Equipment = (typeof EQUIPMENT)[number];
export type FocusArea = (typeof FOCUS_AREAS)[number];
