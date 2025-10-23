// ============================================================================
// SPORTS METRICS TYPES
// ============================================================================

export interface SwimmingMetrics {
  // Basic performance data
  distance: number; // meters
  time: number; // seconds
  stroke: 'freestyle' | 'backstroke' | 'breaststroke' | 'butterfly' | 'medley';

  // Pool information
  poolLength: 25 | 50; // meters
  poolType: 'indoor' | 'outdoor';
  waterTemperature?: number; // celsius

  // Performance details
  splitTimes?: number[]; // array of split times in seconds
  strokeCount?: number; // total strokes
  strokeRate?: number; // strokes per minute

  // Physiological data
  heartRate?: {
    average?: number;
    maximum?: number;
    minimum?: number;
    recovery?: number; // heart rate after 1 minute
    zones?: {
      zone1?: number; // seconds in zone 1 (50-60% max HR)
      zone2?: number; // seconds in zone 2 (60-70% max HR)
      zone3?: number; // seconds in zone 3 (70-80% max HR)
      zone4?: number; // seconds in zone 4 (80-90% max HR)
      zone5?: number; // seconds in zone 5 (90-100% max HR)
    };
  };

  // Technique assessment (1-10 scale)
  technique?: {
    bodyPosition?: number;
    breathing?: number;
    kick?: number;
    pull?: number;
    turns?: number;
    finish?: number;
    overall?: number;
  };

  // Effort and perception
  ratingPerceivedExertion?: number; // 1-10 scale (RPE)
  effortLevel?: 'easy' | 'moderate' | 'hard' | 'very_hard' | 'maximum';

  // Environmental conditions
  conditions?: {
    weather?: 'sunny' | 'cloudy' | 'rainy' | 'windy';
    humidity?: number; // percentage
    temperature?: number; // celsius
    altitude?: number; // meters above sea level
  };
}

export interface TrackFieldMetrics {
  // Basic performance data
  distance: number; // meters
  time?: number; // seconds
  height?: number; // meters (for jumps)
  distance_thrown?: number; // meters (for throws)

  // Event type
  eventType:
    | 'sprint'
    | 'middle_distance'
    | 'long_distance'
    | 'hurdles'
    | 'jump'
    | 'throw'
    | 'combined'
    | 'relay';

  // Track information
  trackType: 'indoor' | 'outdoor';
  trackSurface: 'synthetic' | 'cinder' | 'grass' | 'road';

  // Performance details
  splitTimes?: number[]; // lap or segment times
  pace?: number; // seconds per meter/kilometer

  // Technique (for field events)
  technique?: {
    approach?: number; // 1-10 scale
    takeoff?: number; // 1-10 scale
    flight?: number; // 1-10 scale
    landing?: number; // 1-10 scale
    overall?: number;
  };

  // Physiological data
  heartRate?: {
    average?: number;
    maximum?: number;
    recovery?: number;
  };

  // Environmental
  windSpeed?: number; // m/s (positive = tailwind, negative = headwind)
  temperature?: number; // celsius
  humidity?: number; // percentage
}

export interface GeneralFitnessMetrics {
  // Workout type
  workoutType: 'strength' | 'cardio' | 'flexibility' | 'balance' | 'endurance' | 'recovery';

  // Duration and intensity
  duration: number; // minutes
  intensity: 'low' | 'moderate' | 'high' | 'very_high';

  // Physiological data
  heartRate?: {
    average?: number;
    maximum?: number;
    resting?: number;
    recovery?: number;
  };

  // Effort metrics
  caloriesBurned?: number;
  ratingPerceivedExertion?: number; // 1-10 scale

  // Strength training specific
  weightLifted?: number; // total kg
  sets?: number;
  repetitions?: number;
  maxWeight?: number; // heaviest single lift

  // Cardio specific
  distance?: number; // meters/km
  averagePace?: number; // seconds per unit
  elevationGain?: number; // meters

  // Recovery metrics
  sleepQuality?: number; // 1-10 scale
  stressLevel?: number; // 1-10 scale
  energyLevel?: number; // 1-10 scale
  motivation?: number; // 1-10 scale
}

// Union type for all possible metrics
export type PerformanceMetrics = SwimmingMetrics | TrackFieldMetrics | GeneralFitnessMetrics;

// ============================================================================
// TRAINING STRUCTURE TYPES
// ============================================================================

export interface TrainingExercise {
  id: string;
  name: string;
  description?: string;
  duration?: number; // minutes
  distance?: number; // meters
  repetitions?: number;
  sets?: number;
  restTime?: number; // seconds
  intensity?: 'low' | 'moderate' | 'high' | 'very_high';
  targetHeartRate?: {
    min?: number;
    max?: number;
  };
  technique_focus?: string[];
  equipment?: string[];
  notes?: string;
}

export interface TrainingSet {
  id: string;
  name: string;
  description?: string;
  exercises: TrainingExercise[];
  restBetweenExercises?: number; // seconds
  totalDistance?: number; // calculated total
  totalDuration?: number; // calculated total
  warmup?: boolean;
  mainSet?: boolean;
  cooldown?: boolean;
}

export interface TrainingPlan {
  warmup?: TrainingSet[];
  mainSets: TrainingSet[];
  cooldown?: TrainingSet[];
  totalDuration?: number; // calculated total minutes
  totalDistance?: number; // calculated total meters
  estimatedCalories?: number;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  focus?: string[]; // e.g., ['endurance', 'technique', 'speed']
  equipment?: string[];
  notes?: string;
}

// ============================================================================
// COMMUNICATION TYPES
// ============================================================================

export interface NotificationRecipient {
  type: 'user' | 'role' | 'group' | 'all_club';
  id?: string; // user ID or role name
  criteria?: {
    sport?: string;
    level?: string;
    ageGroup?: string;
    team?: string;
  };
}

export interface NotificationAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  isHtml: boolean;
  variables?: Record<string, string>;
}

// ============================================================================
// MEDICAL RECORD TYPES
// ============================================================================

export interface MedicalHistory {
  conditions?: string[];
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
  }[];
  allergies?: {
    allergen: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
    reaction: string;
  }[];
  surgeries?: {
    procedure: string;
    date: string;
    notes?: string;
  }[];
  injuries?: {
    type: string;
    date: string;
    severity: 'minor' | 'moderate' | 'severe';
    treatment: string;
    recoveryTime?: number; // days
    status: 'active' | 'recovered' | 'chronic';
  }[];
}

export interface FitnessAssessment {
  date: string;
  assessor: string;
  measurements: {
    height?: number; // cm
    weight?: number; // kg
    bodyFatPercentage?: number;
    muscleMass?: number; // kg
    restingHeartRate?: number; // bpm
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
    flexibility?: Record<string, number>; // test scores
    strength?: Record<string, number>; // test scores
    endurance?: Record<string, number>; // test scores
  };
  notes?: string;
}

export interface NutritionPlan {
  calories: number;
  macros: {
    protein: number; // grams
    carbohydrates: number; // grams
    fat: number; // grams
  };
  meals: {
    name: string; // e.g., 'breakfast', 'pre-workout', 'post-workout'
    time: string; // HH:MM format
    foods: string[];
    calories: number;
    notes?: string;
  }[];
  supplements?: {
    name: string;
    dosage: string;
    timing: string;
  }[];
  hydration: {
    dailyWaterGoal: number; // liters
    electrolyteNeeds?: string;
  };
  specialRequirements?: string[];
  notes?: string;
}

// ============================================================================
// PAYMENT AND FINANCIAL TYPES
// ============================================================================

export interface PaymentBreakdown {
  baseAmount: number;
  discounts?: {
    type: 'percentage' | 'fixed';
    value: number;
    reason: string;
  }[];
  taxes?: {
    type: string; // e.g., 'VAT', 'sales_tax'
    rate: number; // percentage
    amount: number;
  }[];
  fees?: {
    type: string; // e.g., 'processing', 'late_fee'
    amount: number;
  }[];
  totalAmount: number;
}

export interface RecurringPaymentSchedule {
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'annually';
  startDate: string;
  endDate?: string;
  dayOfMonth?: number; // for monthly payments
  dayOfWeek?: number; // for weekly payments (0 = Sunday)
  occurrences?: number; // total number of payments
  nextPaymentDate: string;
}

// ============================================================================
// COMPETITION TYPES
// ============================================================================

export interface CompetitionEvent {
  id: string;
  name: string;
  sport: string;
  category: string;
  ageGroup?: string;
  gender?: 'male' | 'female' | 'mixed';
  format: string; // e.g., 'time_trial', 'elimination', 'points'
  qualifying_standard?: {
    time?: number;
    distance?: number;
    score?: number;
  };
  maxParticipants?: number;
  entryFee?: number;
}

export interface CompetitionResult {
  athleteId: string;
  event: string;
  rank: number;
  performance: PerformanceMetrics;
  points?: number;
  disqualified?: boolean;
  disqualificationReason?: string;
  notes?: string;
}

// ============================================================================
// FILE METADATA TYPES
// ============================================================================

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  encoding: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  checksum?: string;
  virus_scan_result?: 'clean' | 'infected' | 'pending';
  processing_status?: 'pending' | 'completed' | 'failed';
}

// ============================================================================
// SETTINGS AND CONFIGURATION TYPES
// ============================================================================

export interface ClubSettings {
  general: {
    defaultLanguage: string;
    defaultTimezone: string;
    defaultCurrency: string;
    dateFormat: string;
    timeFormat: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    defaultChannels: string[];
  };
  training: {
    defaultSessionDuration: number; // minutes
    attendanceTrackingEnabled: boolean;
    performanceTrackingEnabled: boolean;
    autoAssignmentEnabled: boolean;
  };
  payments: {
    acceptedMethods: string[];
    lateFeePercentage: number;
    gracePeriodDays: number;
    recurringPaymentsEnabled: boolean;
  };
  privacy: {
    dataRetentionPeriod: number; // days
    parentalConsentRequired: boolean;
    medicalDataAccessLevel: 'restricted' | 'coaches_only' | 'medical_staff_only';
  };
}

export interface UserPreferences {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    frequency: 'immediate' | 'daily_digest' | 'weekly_digest';
  };
  dashboard: {
    defaultView: string;
    widgets: string[];
    refreshInterval: number; // seconds
  };
  privacy: {
    profileVisibility: 'public' | 'club_only' | 'private';
    performanceDataSharing: boolean;
    contactInfoSharing: boolean;
  };
}
