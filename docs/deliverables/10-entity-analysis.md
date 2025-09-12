# 🔍 Comprehensive Entity Analysis for Sports Platform

## Executive Summary

This document provides a complete entity analysis for the sports platform, focusing on multi-tenant architecture, flexible sports metrics, and clear separation between users and athletic profiles. The design supports the initial swimming focus while enabling future expansion to other sports.

## 1. Conceptual Entity Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CORE USER DOMAIN                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐             │
│  │    Users    │    │ UserClubRoles   │    │     Clubs       │             │
│  │  (People)   │───▶│  (Permissions)  │◄───│  (Tenants)      │             │
│  │             │    │                 │    │                 │             │
│  └─────────────┘    └─────────────────┘    └─────────────────┘             │
│         │                     │                       │                     │
│         │                     │                       │                     │
│         ▼                     ▼                       │                     │
│  ┌─────────────┐                                      │                     │
│  │   Athletes  │                                      │                     │
│  │ (Profiles)  │◄─────────────────────────────────────┘                     │
│  │             │                                                            │
│  └─────────────┘                                                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                         SPORTS DOMAIN                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │ TrainingSessions│    │TrainingTemplates│    │ SportCategories │         │
│  │  (Scheduled)    │───▶│   (Reusable)    │    │   (Swimming)    │         │
│  │                 │    │                 │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│         │                                                                   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────┐                       ┌─────────────────┐             │
│  │TrainingAssignmt │                       │PerformanceData  │             │
│  │  (Who/When)     │                       │  (Metrics)      │             │
│  │                 │                       │                 │             │
│  └─────────────────┘                       └─────────────────┘             │
│         │                                         ▲                         │
│         │                                         │                         │
│         │          ┌─────────────────┐           │                         │
│         └─────────▶│    Athletes     │───────────┘                         │
│                    │   (Profiles)    │                                     │
│                    │                 │                                     │
│                    └─────────────────┘                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    ADMINISTRATIVE DOMAIN                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │   Payments      │    │ Communications  │    │ MedicalRecords  │         │
│  │ (Financials)    │    │  (Messages)     │    │   (Health)      │         │
│  │                 │    │                 │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│         │                         │                       │                 │
│         │                         │                       │                 │
│         │                         │                       │                 │
│         └─────────┬─────────────────┼───────────────────────┘                 │
│                   │                 │                                       │
│                   ▼                 ▼                                       │
│            ┌─────────────────┐ ┌─────────────────┐                         │
│            │    Athletes     │ │     Users       │                         │
│            │   (Profiles)    │ │   (People)      │                         │
│            │                 │ │                 │                         │
│            └─────────────────┘ └─────────────────┘                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPETITION DOMAIN                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │  Competitions   │    │CompetitionEvents│    │CompetitionResult│         │
│  │    (Meets)      │───▶│   (Races)       │───▶│   (Times)       │         │
│  │                 │    │                 │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│         │                         │                       │                 │
│         │                         │                       │                 │
│         ▼                         ▼                       ▼                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐         │
│  │CompetitionEntry │    │    Athletes     │    │PerformanceData  │         │
│  │ (Registrations) │───▶│   (Profiles)    │───▶│   (Records)     │         │
│  │                 │    │                 │    │                 │         │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Detailed Entity Definitions

### **👤 Core User Domain**

#### **Users (People - System Access)**

```typescript
interface User {
  id: string; // Primary key (CUID)
  email: string; // Unique, Google OAuth email
  googleId: string; // Google OAuth identifier
  name: string; // Full name from Google
  profilePicture?: string; // Google profile image URL
  phone?: string; // Contact number
  emergencyContact?: string; // Emergency contact info
  preferredLanguage: string; // i18n support
  timezone: string; // User's timezone
  isActive: boolean; // Account status
  lastLoginAt?: Date; // Last login timestamp
  createdAt: Date; // Account creation
  updatedAt: Date; // Last update

  // Relationships
  athletes: Athlete[]; // Athletic profiles in various clubs
  clubRoles: UserClubRole[]; // Roles across different clubs
  sessions: UserSession[]; // Active sessions
  auditLogs: AuditLog[]; // Activity tracking
}
```

#### **UserClubRoles (Permissions)**

```typescript
interface UserClubRole {
  id: string; // Primary key
  userId: string; // Foreign key to Users
  clubId: string; // Foreign key to Clubs
  role: UserRole; // Enum: COACH, ADMIN, ATHLETE, PARENT, MEDICAL, DIRECTOR
  permissions: string[]; // Granular permissions array
  isActive: boolean; // Role status
  assignedBy: string; // Who assigned this role
  assignedAt: Date; // When role was assigned
  expiresAt?: Date; // Optional role expiration
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  user: User;
  club: Club;
  assignedByUser: User;
}

enum UserRole {
  COACH = "COACH",
  ADMIN = "ADMIN",
  ATHLETE = "ATHLETE",
  PARENT = "PARENT",
  MEDICAL = "MEDICAL",
  DIRECTOR = "DIRECTOR",
}
```

#### **Clubs (Tenants)**

```typescript
interface Club {
  id: string; // Primary key (tenant ID)
  name: string; // Club name
  description?: string; // Club description
  logo?: string; // Club logo URL
  address: string; // Physical address
  phone: string; // Contact phone
  email: string; // Contact email
  website?: string; // Club website
  foundedYear?: number; // Founding year
  sports: Sport[]; // Supported sports
  timezone: string; // Club's timezone
  currency: string; // Default currency
  language: string; // Default language
  settings: Json; // Club-specific settings (JSONB)
  isActive: boolean; // Club status
  subscriptionTier: string; // Subscription level
  maxAthletes: number; // Subscription limit
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  athletes: Athlete[]; // Athletes in this club
  userRoles: UserClubRole[]; // User roles in this club
  trainingSessions: TrainingSession[];
  competitions: Competition[];
  payments: Payment[];
  communications: Communication[];
}

enum Sport {
  SWIMMING = "SWIMMING",
  TRACK_FIELD = "TRACK_FIELD",
  SOCCER = "SOCCER",
  BASKETBALL = "BASKETBALL",
  TENNIS = "TENNIS",
}
```

#### **Athletes (Sport Profiles)**

```typescript
interface Athlete {
  id: string; // Primary key
  userId: string; // Foreign key to Users
  clubId: string; // Foreign key to Clubs (tenant)
  athleteNumber?: string; // Club-specific athlete number
  firstName: string; // First name
  lastName: string; // Last name
  nickname?: string; // Preferred name
  dateOfBirth: Date; // Birth date for age calculations
  gender: Gender; // Gender
  profilePicture?: string; // Athlete photo
  sport: Sport; // Primary sport
  category: string; // Age/skill category
  level: AthleteLevel; // Skill level
  joinedAt: Date; // When joined club
  isActive: boolean; // Active status
  personalBests: Json; // Personal records (JSONB)
  goals: Json; // Current goals (JSONB)
  notes?: string; // Coach notes
  parentId?: string; // Parent/guardian user ID
  emergencyContacts: Json; // Emergency contact info (JSONB)
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  user: User; // Person behind the athlete
  club: Club; // Club membership
  parent?: User; // Parent/guardian
  trainingAssignments: TrainingAssignment[];
  performanceData: PerformanceData[];
  competitionEntries: CompetitionEntry[];
  medicalRecords: MedicalRecord[];
  payments: Payment[];
}

enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

enum AthleteLevel {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  ELITE = "ELITE",
}
```

### **🏊‍♂️ Sports Domain**

#### **TrainingTemplates (Reusable Workouts)**

```typescript
interface TrainingTemplate {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  name: string; // Template name
  description?: string; // Template description
  sport: Sport; // Sport type
  category: string; // Training category (endurance, sprint, technique)
  level: AthleteLevel; // Target level
  duration: number; // Expected duration in minutes
  structure: Json; // Workout structure (JSONB)
  equipment: string[]; // Required equipment
  tags: string[]; // Searchable tags
  isPublic: boolean; // Shareable with other clubs
  createdBy: string; // Coach who created it
  usageCount: number; // How many times used
  rating: number; // Average rating
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  creator: User;
  trainingSessions: TrainingSession[];
}
```

#### **TrainingSessions (Scheduled Workouts)**

```typescript
interface TrainingSession {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  templateId?: string; // Optional template reference
  title: string; // Session title
  description?: string; // Session description
  sport: Sport; // Sport type
  category: string; // Training category
  level: AthleteLevel; // Target level
  scheduledAt: Date; // Scheduled date/time
  duration: number; // Duration in minutes
  location: string; // Training location
  maxParticipants?: number; // Capacity limit
  isRecurring: boolean; // Recurring session flag
  recurrencePattern?: Json; // Recurrence rules (JSONB)
  status: SessionStatus; // Session status
  actualStartTime?: Date; // Actual start time
  actualEndTime?: Date; // Actual end time
  workout: Json; // Detailed workout plan (JSONB)
  equipment: string[]; // Required equipment
  notes?: string; // Session notes
  coachId: string; // Assigned coach
  assistantCoaches: string[]; // Assistant coaches
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  template?: TrainingTemplate;
  coach: User;
  assignments: TrainingAssignment[];
  performanceData: PerformanceData[];
}

enum SessionStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  POSTPONED = "POSTPONED",
}
```

#### **TrainingAssignments (Who Attends What)**

```typescript
interface TrainingAssignment {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  sessionId: string; // Foreign key to TrainingSessions
  athleteId: string; // Foreign key to Athletes
  assignedBy: string; // Who assigned (coach)
  assignedAt: Date; // Assignment date
  status: AssignmentStatus; // Assignment status
  attendanceStatus: AttendanceStatus; // Actual attendance
  checkedInAt?: Date; // Check-in time
  checkedOutAt?: Date; // Check-out time
  modifications: Json; // Session modifications for athlete (JSONB)
  coachNotes?: string; // Coach observations
  athleteNotes?: string; // Athlete feedback
  rating?: number; // Session rating (1-5)
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  session: TrainingSession;
  athlete: Athlete;
  assignedByUser: User;
}

enum AssignmentStatus {
  ASSIGNED = "ASSIGNED",
  CONFIRMED = "CONFIRMED",
  DECLINED = "DECLINED",
  CANCELLED = "CANCELLED",
}

enum AttendanceStatus {
  SCHEDULED = "SCHEDULED",
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  EARLY_DEPARTURE = "EARLY_DEPARTURE",
}
```

#### **PerformanceData (Flexible Metrics)**

```typescript
interface PerformanceData {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  athleteId: string; // Foreign key to Athletes
  sessionId?: string; // Optional training session
  competitionId?: string; // Optional competition
  recordedAt: Date; // When performance was recorded
  recordedBy: string; // Who recorded it (coach/athlete)
  sport: Sport; // Sport type
  event: string; // Event type (50m freestyle, etc.)
  category: string; // Performance category
  metrics: Json; // Flexible metrics storage (JSONB)
  conditions: Json; // Environmental conditions (JSONB)
  equipment: Json; // Equipment used (JSONB)
  isPersonalBest: boolean; // Auto-calculated PR flag
  isSeasonBest: boolean; // Season best flag
  tags: string[]; // Performance tags
  notes?: string; // Additional notes
  videoUrl?: string; // Performance video
  validated: boolean; // Verified by coach
  validatedBy?: string; // Who validated
  validatedAt?: Date; // Validation timestamp
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  athlete: Athlete;
  session?: TrainingSession;
  competition?: Competition;
  recordedByUser: User;
}

// Example Swimming Metrics JSONB Structure
interface SwimmingMetrics {
  time: number; // Time in seconds
  distance: number; // Distance in meters
  stroke: "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "medley";
  strokeCount?: number; // Strokes per length
  strokeRate?: number; // Strokes per minute
  splits: number[]; // Split times
  technique: {
    bodyPosition?: number; // 1-10 rating
    breathing?: number; // 1-10 rating
    kick?: number; // 1-10 rating
    pullTechnique?: number; // 1-10 rating
  };
  heartRate?: {
    max?: number;
    avg?: number;
    zones?: number[]; // Time in each HR zone
  };
}
```

### **🏆 Competition Domain**

#### **Competitions (Meets/Events)**

```typescript
interface Competition {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  name: string; // Competition name
  description?: string; // Competition description
  type: CompetitionType; // Internal/external competition
  sport: Sport; // Sport type
  level: CompetitionLevel; // Competition level
  venue: string; // Competition venue
  startDate: Date; // Start date
  endDate: Date; // End date
  registrationDeadline: Date; // Registration deadline
  maxParticipants?: number; // Participation limit
  ageCategories: string[]; // Age categories
  events: string[]; // Competition events
  entryFee?: number; // Entry fee amount
  status: CompetitionStatus; // Competition status
  results: Json; // Competition results (JSONB)
  organizer: string; // Organizing entity
  contactInfo: Json; // Contact information (JSONB)
  rules: Json; // Competition rules (JSONB)
  createdBy: string; // Who created the competition
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  entries: CompetitionEntry[];
  events: CompetitionEvent[];
  creator: User;
}

enum CompetitionType {
  INTERNAL = "INTERNAL", // Club internal competition
  REGIONAL = "REGIONAL", // Regional level
  NATIONAL = "NATIONAL", // National level
  INTERNATIONAL = "INTERNATIONAL", // International level
}

enum CompetitionLevel {
  RECREATIONAL = "RECREATIONAL",
  CLUB = "CLUB",
  REGIONAL = "REGIONAL",
  STATE = "STATE",
  NATIONAL = "NATIONAL",
  INTERNATIONAL = "INTERNATIONAL",
}

enum CompetitionStatus {
  UPCOMING = "UPCOMING",
  REGISTRATION_OPEN = "REGISTRATION_OPEN",
  REGISTRATION_CLOSED = "REGISTRATION_CLOSED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
```

#### **CompetitionEntries (Athlete Registrations)**

```typescript
interface CompetitionEntry {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  competitionId: string; // Foreign key to Competitions
  athleteId: string; // Foreign key to Athletes
  events: string[]; // Registered events
  category: string; // Age/skill category
  seedTimes: Json; // Seed times for events (JSONB)
  registeredAt: Date; // Registration timestamp
  registeredBy: string; // Who registered the athlete
  status: EntryStatus; // Entry status
  paymentStatus: PaymentStatus; // Payment status
  confirmationNumber?: string; // Entry confirmation
  specialRequests?: string; // Special requirements
  notes?: string; // Additional notes
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  competition: Competition;
  athlete: Athlete;
  registeredByUser: User;
  results: CompetitionResult[];
}

enum EntryStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  WITHDRAWN = "WITHDRAWN",
  DISQUALIFIED = "DISQUALIFIED",
}
```

#### **CompetitionResults (Performance Results)**

```typescript
interface CompetitionResult {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  competitionId: string; // Foreign key to Competitions
  athleteId: string; // Foreign key to Athletes
  entryId: string; // Foreign key to CompetitionEntry
  event: string; // Specific event
  performance: Json; // Performance data (JSONB)
  place: number; // Final placement
  lane?: number; // Lane assignment
  heat?: number; // Heat number
  preliminaryTime?: number; // Preliminary time
  finalTime?: number; // Final time
  isPersonalBest: boolean; // PR achieved
  isSeasonBest: boolean; // Season best
  splits: number[]; // Split times
  disqualified: boolean; // DQ status
  disqualificationReason?: string; // DQ reason
  notes?: string; // Result notes
  recordedAt: Date; // When result was recorded
  recordedBy: string; // Who recorded the result
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  competition: Competition;
  athlete: Athlete;
  entry: CompetitionEntry;
  recordedByUser: User;
}
```

### **💰 Administrative Domain**

#### **Payments (Financial Management)**

```typescript
interface Payment {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  athleteId?: string; // Optional athlete association
  userId?: string; // Payer (could be parent)
  type: PaymentType; // Payment type
  category: PaymentCategory; // Payment category
  amount: number; // Payment amount
  currency: string; // Currency code
  description: string; // Payment description
  dueDate: Date; // Due date
  paidAt?: Date; // Payment date
  status: PaymentStatus; // Payment status
  method?: PaymentMethod; // Payment method
  reference?: string; // Payment reference
  notes?: string; // Additional notes
  recurringSchedule?: Json; // Recurring payment info (JSONB)
  discounts: Json; // Applied discounts (JSONB)
  taxes: Json; // Tax information (JSONB)
  invoiceNumber?: string; // Invoice number
  receiptUrl?: string; // Receipt file URL
  processedBy?: string; // Who processed payment
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  athlete?: Athlete;
  payer?: User;
  processedByUser?: User;
}

enum PaymentType {
  MEMBERSHIP = "MEMBERSHIP",
  TRAINING = "TRAINING",
  COMPETITION = "COMPETITION",
  EQUIPMENT = "EQUIPMENT",
  FACILITY = "FACILITY",
  OTHER = "OTHER",
}

enum PaymentCategory {
  MONTHLY_FEE = "MONTHLY_FEE",
  ANNUAL_FEE = "ANNUAL_FEE",
  REGISTRATION = "REGISTRATION",
  COMPETITION_ENTRY = "COMPETITION_ENTRY",
  EQUIPMENT_PURCHASE = "EQUIPMENT_PURCHASE",
  FACILITY_RENTAL = "FACILITY_RENTAL",
  COACHING_FEE = "COACHING_FEE",
  LATE_FEE = "LATE_FEE",
}

enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED",
  PARTIAL = "PARTIAL",
}

enum PaymentMethod {
  CASH = "CASH",
  CHECK = "CHECK",
  BANK_TRANSFER = "BANK_TRANSFER",
  CREDIT_CARD = "CREDIT_CARD",
  PAYPAL = "PAYPAL",
  OTHER = "OTHER",
}
```

#### **Communications (Messaging System)**

```typescript
interface Communication {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  type: CommunicationType; // Communication type
  channel: CommunicationChannel; // Delivery channel
  senderId: string; // Who sent the message
  title: string; // Message title
  content: string; // Message content
  recipients: Json; // Recipient configuration (JSONB)
  scheduledAt?: Date; // Scheduled delivery time
  sentAt?: Date; // Actual send time
  status: CommunicationStatus; // Message status
  priority: MessagePriority; // Message priority
  tags: string[]; // Message tags
  attachments: Json; // Attachment info (JSONB)
  readReceipts: Json; // Read tracking (JSONB)
  responses: Json; // Response tracking (JSONB)
  expiresAt?: Date; // Message expiration
  isEmergency: boolean; // Emergency message flag
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  sender: User;
}

enum CommunicationType {
  ANNOUNCEMENT = "ANNOUNCEMENT",
  REMINDER = "REMINDER",
  ALERT = "ALERT",
  NEWSLETTER = "NEWSLETTER",
  PERSONAL_MESSAGE = "PERSONAL_MESSAGE",
  EMERGENCY = "EMERGENCY",
}

enum CommunicationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  SMS = "SMS",
  PUSH_NOTIFICATION = "PUSH_NOTIFICATION",
  ALL_CHANNELS = "ALL_CHANNELS",
}

enum CommunicationStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  SENDING = "SENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

enum MessagePriority {
  LOW = "LOW",
  NORMAL = "NORMAL",
  HIGH = "HIGH",
  URGENT = "URGENT",
}
```

#### **MedicalRecords (Health Information)**

```typescript
interface MedicalRecord {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  athleteId: string; // Foreign key to Athletes
  type: MedicalRecordType; // Record type
  title: string; // Record title
  description?: string; // Detailed description
  data: Json; // Medical data (JSONB)
  recordDate: Date; // Record date
  expiryDate?: Date; // Expiration date
  isActive: boolean; // Active status
  restrictions: string[]; // Training restrictions
  recommendations: string[]; // Medical recommendations
  attachments: Json; // Medical documents (JSONB)
  confidentiality: ConfidentialityLevel; // Privacy level
  recordedBy: string; // Medical professional
  approvedBy?: string; // Approving doctor
  notes?: string; // Additional notes
  emergencyInfo: Json; // Emergency medical info (JSONB)
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  athlete: Athlete;
  recordedByUser: User;
  approvedByUser?: User;
}

enum MedicalRecordType {
  PHYSICAL_EXAM = "PHYSICAL_EXAM",
  MEDICAL_CLEARANCE = "MEDICAL_CLEARANCE",
  INJURY_REPORT = "INJURY_REPORT",
  ALLERGY_INFO = "ALLERGY_INFO",
  MEDICATION = "MEDICATION",
  NUTRITION_PLAN = "NUTRITION_PLAN",
  FITNESS_ASSESSMENT = "FITNESS_ASSESSMENT",
  EMERGENCY_INFO = "EMERGENCY_INFO",
}

enum ConfidentialityLevel {
  PUBLIC = "PUBLIC", // Visible to coaches
  RESTRICTED = "RESTRICTED", // Medical staff only
  CONFIDENTIAL = "CONFIDENTIAL", // Doctor only
}
```

### **📁 Supporting Entities**

#### **Files (Document Management)**

```typescript
interface File {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  uploadedBy: string; // Who uploaded the file
  fileName: string; // Original file name
  fileType: string; // MIME type
  fileSize: number; // File size in bytes
  filePath: string; // Storage path/URL
  category: FileCategory; // File category
  entityType?: string; // Related entity type
  entityId?: string; // Related entity ID
  description?: string; // File description
  tags: string[]; // Searchable tags
  isPublic: boolean; // Public visibility
  downloadCount: number; // Download tracking
  lastAccessedAt?: Date; // Last access time
  expiresAt?: Date; // File expiration
  createdAt: Date;
  updatedAt: Date;

  // Relationships
  club: Club;
  uploadedByUser: User;
}

enum FileCategory {
  PROFILE_PICTURE = "PROFILE_PICTURE",
  MEDICAL_DOCUMENT = "MEDICAL_DOCUMENT",
  TRAINING_VIDEO = "TRAINING_VIDEO",
  COMPETITION_PHOTO = "COMPETITION_PHOTO",
  CERTIFICATE = "CERTIFICATE",
  INVOICE = "INVOICE",
  REPORT = "REPORT",
  OTHER = "OTHER",
}
```

#### **AuditLogs (Activity Tracking)**

```typescript
interface AuditLog {
  id: string; // Primary key
  clubId: string; // Foreign key to Clubs
  userId: string; // Who performed the action
  action: string; // Action performed
  entityType: string; // Entity affected
  entityId: string; // Entity ID
  oldValues?: Json; // Previous values
  newValues?: Json; // New values
  metadata: Json; // Additional metadata
  ipAddress?: string; // Client IP
  userAgent?: string; // Client user agent
  timestamp: Date; // Action timestamp

  // Relationships
  club: Club;
  user: User;
}
```

## 3. Relationship Matrix

| Entity                 | Relationship Type | Related Entity      | Notes                                       |
| ---------------------- | ----------------- | ------------------- | ------------------------------------------- |
| **Users**              | 1:N               | Athletes            | One person can be athlete in multiple clubs |
| **Users**              | 1:N               | UserClubRoles       | Different roles across clubs                |
| **Users**              | 1:N               | UserSessions        | Multiple active sessions                    |
| **Clubs**              | 1:N               | Athletes            | Club contains athletes                      |
| **Clubs**              | 1:N               | UserClubRoles       | Club has users with roles                   |
| **Clubs**              | 1:N               | TrainingSessions    | Club schedules training                     |
| **Athletes**           | N:M               | TrainingSessions    | Through TrainingAssignments                 |
| **Athletes**           | 1:N               | PerformanceData     | Athlete has performance records             |
| **Athletes**           | 1:N               | CompetitionEntries  | Athlete enters competitions                 |
| **TrainingSessions**   | 1:N               | TrainingAssignments | Session has assignments                     |
| **TrainingSessions**   | 1:N               | PerformanceData     | Performance recorded in session             |
| **Competitions**       | 1:N               | CompetitionEntries  | Competition has entries                     |
| **CompetitionEntries** | 1:N               | CompetitionResults  | Entry has results                           |
| **Athletes**           | 1:N               | Payments            | Athlete has payment records                 |
| **Athletes**           | 1:N               | MedicalRecords      | Athlete has medical records                 |
| **Users**              | 1:N               | Communications      | User sends messages                         |
| **Users**              | 1:N               | Files               | User uploads files                          |

## 4. Multi-Tenancy Strategy

### **Club-Based Isolation**

```typescript
// Automatic club filtering middleware
@Injectable()
export class ClubTenancyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Inject club context for automatic filtering
    if (user && user.currentClubId) {
      request.clubFilter = { clubId: user.currentClubId };
    }

    return next.handle();
  }
}

// Prisma middleware for automatic filtering
prisma.$use(async (params, next) => {
  const clubId = params.args?.clubFilter?.clubId;

  if (clubId && TENANT_ENTITIES.includes(params.model)) {
    if (params.action === "findMany" || params.action === "findFirst") {
      params.args.where = {
        ...params.args.where,
        clubId: clubId,
      };
    }

    if (params.action === "create" || params.action === "createMany") {
      if (params.args.data) {
        params.args.data.clubId = clubId;
      }
    }
  }

  return next(params);
});

const TENANT_ENTITIES = [
  "Athlete",
  "TrainingSession",
  "TrainingAssignment",
  "PerformanceData",
  "Competition",
  "CompetitionEntry",
  "Payment",
  "Communication",
  "MedicalRecord",
  "File",
  "AuditLog",
];
```

### **Row-Level Security (RLS)**

```sql
-- Example RLS policies for PostgreSQL
CREATE POLICY club_isolation_policy ON athletes
  FOR ALL
  USING (club_id = current_setting('app.current_club_id')::uuid);

CREATE POLICY club_isolation_policy ON training_sessions
  FOR ALL
  USING (club_id = current_setting('app.current_club_id')::uuid);

-- Enable RLS on tenant tables
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_data ENABLE ROW LEVEL SECURITY;
```

## 5. Flexible Sports Metrics (JSONB Examples)

### **Swimming Performance Metrics**

```typescript
interface SwimmingPerformance {
  time: number; // Time in seconds (e.g., 58.23)
  distance: number; // Distance in meters (e.g., 100)
  stroke: "freestyle" | "backstroke" | "breaststroke" | "butterfly" | "medley";
  strokeCount?: number; // Total strokes
  strokeRate?: number; // Strokes per minute
  splits?: number[]; // 25m, 50m, 75m splits
  technique?: {
    bodyPosition: number; // 1-10 rating
    breathing: number; // 1-10 rating
    kick: number; // 1-10 rating
    pull: number; // 1-10 rating
    turns: number; // 1-10 rating
    finish: number; // 1-10 rating
  };
  heartRate?: {
    max: number;
    average: number;
    recovery: number; // HR after 1 minute
    zones: {
      // Time in each zone
      zone1: number; // Recovery (50-60% max)
      zone2: number; // Aerobic (60-70% max)
      zone3: number; // Aerobic threshold (70-80% max)
      zone4: number; // Lactate threshold (80-90% max)
      zone5: number; // VO2 max (90-100% max)
    };
  };
  lactate?: number; // Blood lactate mmol/L
  rpe?: number; // Rate of Perceived Exertion (1-10)
  pool?: {
    length: number; // Pool length (25m, 50m)
    temperature: number; // Water temperature
    type: "outdoor" | "indoor";
  };
  conditions?: {
    weather?: string;
    humidity?: number;
    temperature?: number;
  };
}
```

### **Track & Field Performance Metrics**

```typescript
interface TrackFieldPerformance {
  // Sprint events
  time?: number; // Time in seconds
  distance?: number; // Distance in meters

  // Distance events
  pace?: number; // Pace per kilometer
  splits?: number[]; // Lap times

  // Field events
  measurement?: number; // Distance/height achieved
  attempts?: number[]; // All attempts

  // General metrics
  technique?: {
    start?: number; // 1-10 rating for sprints
    form?: number; // Running form
    finish?: number; // Finish technique
  };

  conditions?: {
    wind?: number; // Wind speed (m/s)
    temperature?: number;
    humidity?: number;
    altitude?: number;
    track_surface?: string;
  };

  equipment?: {
    spikes?: string;
    implements?: string; // For field events
  };
}
```

## 6. Scalability Considerations

### **Database Indexing Strategy**

```sql
-- Core performance indexes
CREATE INDEX idx_athletes_club_active ON athletes(club_id, is_active);
CREATE INDEX idx_training_sessions_club_date ON training_sessions(club_id, scheduled_at);
CREATE INDEX idx_performance_data_athlete_date ON performance_data(athlete_id, recorded_at);
CREATE INDEX idx_training_assignments_session ON training_assignments(session_id, attendance_status);

-- Multi-tenant indexes
CREATE INDEX idx_payments_club_status ON payments(club_id, status, due_date);
CREATE INDEX idx_communications_club_type ON communications(club_id, type, sent_at);

-- JSONB indexes for flexible metrics
CREATE INDEX idx_performance_metrics_gin ON performance_data USING GIN(metrics);
CREATE INDEX idx_athlete_personal_bests ON athletes USING GIN(personal_bests);

-- Partial indexes for active records
CREATE INDEX idx_active_athletes ON athletes(club_id) WHERE is_active = true;
CREATE INDEX idx_upcoming_sessions ON training_sessions(club_id, scheduled_at) WHERE status = 'SCHEDULED';
```

### **Partitioning Strategy**

```sql
-- Partition performance data by date for better query performance
CREATE TABLE performance_data (
    -- columns...
) PARTITION BY RANGE (recorded_at);

CREATE TABLE performance_data_2024 PARTITION OF performance_data
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE performance_data_2025 PARTITION OF performance_data
    FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

## 7. Use Case Validation

### **Use Case 1: Coach Creates Training Session**

```
1. Coach logs in → UserClubRole validates COACH role
2. Coach creates TrainingSession → clubId auto-injected
3. Coach assigns Athletes → TrainingAssignments created
4. System sends notifications → Communication records created
5. Athletes receive push notifications → delivery tracked
```

### **Use Case 2: Athlete Records Performance**

```
1. Athlete checks in to session → TrainingAssignment.attendanceStatus = PRESENT
2. Coach records performance → PerformanceData created with JSONB metrics
3. System calculates if PR → isPersonalBest flag updated
4. Athlete.personalBests JSONB updated → historical tracking
5. Parent receives progress notification → Communication sent
```

### **Use Case 3: Multi-Club Parent Access**

```
1. Parent logs in → UserClubRoles shows access to multiple clubs
2. Parent switches club context → club filter updated
3. Parent views children in current club → automatic filtering by clubId
4. Parent pays fees → Payment linked to specific athlete and club
5. All data properly isolated by club → security maintained
```

### **Use Case 4: Medical Staff Updates Restrictions**

```
1. Medical staff accesses athlete record → role validation
2. Updates MedicalRecord with new restrictions → confidentiality enforced
3. System notifies assigned coaches → filtered by permissions
4. Training assignments consider restrictions → business rule enforcement
5. Audit log tracks medical data access → compliance maintained
```

## Conclusion

This entity analysis provides:

✅ **Clear User/Athlete Separation**: Enables multi-club membership and role flexibility
✅ **Robust Multi-Tenancy**: Club-based isolation with automatic filtering
✅ **Flexible Sports Metrics**: JSONB storage for sport-specific performance data
✅ **Comprehensive Relationships**: All business scenarios supported with proper referential integrity
✅ **Scalability Foundation**: Designed for future sports and advanced analytics
✅ **Security by Design**: Role-based permissions and audit logging built-in
✅ **Performance Optimized**: Strategic indexing and partitioning considerations

The entity model supports the platform's growth from swimming-focused MVP to multi-sport enterprise platform while maintaining data integrity and performance.
