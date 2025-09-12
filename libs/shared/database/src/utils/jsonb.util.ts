import {
  PerformanceMetrics,
  SwimmingMetrics,
  TrackFieldMetrics,
  GeneralFitnessMetrics,
} from "../types/sports.types";

/**
 * JSONB utilities for handling flexible sports metrics and complex JSON operations
 */
export class JsonbUtil {
  /**
   * Validate swimming metrics structure
   */
  static validateSwimmingMetrics(metrics: any): metrics is SwimmingMetrics {
    if (!metrics || typeof metrics !== "object") {
      return false;
    }

    // Required fields
    if (typeof metrics.distance !== "number" || metrics.distance <= 0) {
      return false;
    }

    if (typeof metrics.time !== "number" || metrics.time <= 0) {
      return false;
    }

    const validStrokes = [
      "freestyle",
      "backstroke",
      "breaststroke",
      "butterfly",
      "medley",
    ];
    if (!validStrokes.includes(metrics.stroke)) {
      return false;
    }

    const validPoolLengths = [25, 50];
    if (metrics.poolLength && !validPoolLengths.includes(metrics.poolLength)) {
      return false;
    }

    // Validate optional nested objects
    if (metrics.heartRate && !this.validateHeartRateData(metrics.heartRate)) {
      return false;
    }

    if (metrics.technique && !this.validateTechniqueScores(metrics.technique)) {
      return false;
    }

    return true;
  }

  /**
   * Validate track and field metrics structure
   */
  static validateTrackFieldMetrics(metrics: any): metrics is TrackFieldMetrics {
    if (!metrics || typeof metrics !== "object") {
      return false;
    }

    // Required fields
    if (typeof metrics.distance !== "number" || metrics.distance <= 0) {
      return false;
    }

    const validEventTypes = [
      "sprint",
      "middle_distance",
      "long_distance",
      "hurdles",
      "jump",
      "throw",
      "combined",
      "relay",
    ];
    if (!validEventTypes.includes(metrics.eventType)) {
      return false;
    }

    const validTrackTypes = ["indoor", "outdoor"];
    if (!validTrackTypes.includes(metrics.trackType)) {
      return false;
    }

    // Validate time is present for running events
    const runningEvents = [
      "sprint",
      "middle_distance",
      "long_distance",
      "hurdles",
      "relay",
    ];
    if (
      runningEvents.includes(metrics.eventType) &&
      (!metrics.time || metrics.time <= 0)
    ) {
      return false;
    }

    return true;
  }

  /**
   * Validate general fitness metrics structure
   */
  static validateGeneralFitnessMetrics(
    metrics: any
  ): metrics is GeneralFitnessMetrics {
    if (!metrics || typeof metrics !== "object") {
      return false;
    }

    const validWorkoutTypes = [
      "strength",
      "cardio",
      "flexibility",
      "balance",
      "endurance",
      "recovery",
    ];
    if (!validWorkoutTypes.includes(metrics.workoutType)) {
      return false;
    }

    if (typeof metrics.duration !== "number" || metrics.duration <= 0) {
      return false;
    }

    const validIntensities = ["low", "moderate", "high", "very_high"];
    if (!validIntensities.includes(metrics.intensity)) {
      return false;
    }

    return true;
  }

  /**
   * Validate heart rate data structure
   */
  private static validateHeartRateData(heartRate: any): boolean {
    if (!heartRate || typeof heartRate !== "object") {
      return false;
    }

    // Check that all heart rate values are positive numbers
    const hrFields = ["average", "maximum", "minimum", "recovery"];
    for (const field of hrFields) {
      if (
        heartRate[field] !== undefined &&
        (typeof heartRate[field] !== "number" || heartRate[field] <= 0)
      ) {
        return false;
      }
    }

    // Validate zones if present
    if (heartRate.zones) {
      const zoneFields = ["zone1", "zone2", "zone3", "zone4", "zone5"];
      for (const zone of zoneFields) {
        if (
          heartRate.zones[zone] !== undefined &&
          (typeof heartRate.zones[zone] !== "number" ||
            heartRate.zones[zone] < 0)
        ) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Validate technique scores (1-10 scale)
   */
  private static validateTechniqueScores(technique: any): boolean {
    if (!technique || typeof technique !== "object") {
      return false;
    }

    const techniqueFields = [
      "bodyPosition",
      "breathing",
      "kick",
      "pull",
      "turns",
      "finish",
      "overall",
      "approach",
      "takeoff",
      "flight",
      "landing",
    ];

    for (const field of techniqueFields) {
      if (technique[field] !== undefined) {
        const score = technique[field];
        if (typeof score !== "number" || score < 1 || score > 10) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Determine the type of performance metrics
   */
  static getMetricsType(
    metrics: any
  ): "swimming" | "track_field" | "general_fitness" | "unknown" {
    if (this.validateSwimmingMetrics(metrics)) {
      return "swimming";
    }
    if (this.validateTrackFieldMetrics(metrics)) {
      return "track_field";
    }
    if (this.validateGeneralFitnessMetrics(metrics)) {
      return "general_fitness";
    }
    return "unknown";
  }

  /**
   * Extract performance value for comparison (time, distance, score, etc.)
   */
  static extractPerformanceValue(metrics: PerformanceMetrics): number | null {
    const metricsType = this.getMetricsType(metrics);

    switch (metricsType) {
      case "swimming":
        return (metrics as SwimmingMetrics).time;

      case "track_field":
        const trackMetrics = metrics as TrackFieldMetrics;
        return (
          trackMetrics.time ||
          trackMetrics.distance_thrown ||
          trackMetrics.height ||
          null
        );

      case "general_fitness":
        const fitnessMetrics = metrics as GeneralFitnessMetrics;
        return fitnessMetrics.duration;

      default:
        return null;
    }
  }

  /**
   * Compare two performance metrics to determine if the new one is better
   */
  static isBetterPerformance(
    newMetrics: PerformanceMetrics,
    existingMetrics: PerformanceMetrics,
    event: string
  ): boolean {
    const newValue = this.extractPerformanceValue(newMetrics);
    const existingValue = this.extractPerformanceValue(existingMetrics);

    if (newValue === null || existingValue === null) {
      return false;
    }

    // For swimming and running, lower time is better
    if (this.isTimeBasedEvent(event)) {
      return newValue < existingValue;
    }

    // For throws and jumps, higher distance/height is better
    if (this.isDistanceBasedEvent(event)) {
      return newValue > existingValue;
    }

    // Default: higher is better
    return newValue > existingValue;
  }

  /**
   * Check if event is time-based (lower is better)
   */
  private static isTimeBasedEvent(event: string): boolean {
    const timeBasedKeywords = [
      "freestyle",
      "backstroke",
      "breaststroke",
      "butterfly",
      "medley",
      "sprint",
      "dash",
      "run",
      "hurdles",
      "marathon",
      "relay",
    ];

    return timeBasedKeywords.some((keyword) =>
      event.toLowerCase().includes(keyword)
    );
  }

  /**
   * Check if event is distance-based (higher is better)
   */
  private static isDistanceBasedEvent(event: string): boolean {
    const distanceBasedKeywords = [
      "shot",
      "discus",
      "hammer",
      "javelin",
      "throw",
      "jump",
      "pole",
      "vault",
      "long",
      "high",
      "triple",
    ];

    return distanceBasedKeywords.some((keyword) =>
      event.toLowerCase().includes(keyword)
    );
  }

  /**
   * Merge JSONB objects with deep merge support
   */
  static mergeJsonb<T>(target: T, source: Partial<T>): T {
    if (!source || typeof source !== "object") {
      return target;
    }

    const result = { ...target };

    for (const [key, value] of Object.entries(source)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (
        typeof value === "object" &&
        !Array.isArray(value) &&
        typeof result[key as keyof T] === "object" &&
        !Array.isArray(result[key as keyof T])
      ) {
        // Deep merge for nested objects
        result[key as keyof T] = this.mergeJsonb(
          result[key as keyof T] as any,
          value
        );
      } else {
        // Direct assignment for primitives and arrays
        result[key as keyof T] = value as any;
      }
    }

    return result;
  }

  /**
   * Generate Prisma JSONB query for path-based searches
   */
  static createJsonbPathQuery(field: string, path: string, value: any): any {
    return {
      [field]: {
        path: path.split("."),
        equals: value,
      },
    };
  }

  /**
   * Generate Prisma JSONB query for contains operation
   */
  static createJsonbContainsQuery(field: string, value: any): any {
    return {
      [field]: {
        contains: value,
      },
    };
  }

  /**
   * Generate Prisma JSONB query for array contains operation
   */
  static createJsonbArrayContainsQuery(
    field: string,
    path: string,
    value: any
  ): any {
    return {
      [field]: {
        path: path.split("."),
        array_contains: [value],
      },
    };
  }

  /**
   * Extract specific fields from JSONB data
   */
  static extractFields<T>(jsonbData: any, fields: string[]): Partial<T> {
    if (!jsonbData || typeof jsonbData !== "object") {
      return {};
    }

    const result: any = {};

    for (const field of fields) {
      const parts = field.split(".");
      let current = jsonbData;

      for (const part of parts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }

      if (current !== undefined) {
        this.setNestedProperty(result, field, current);
      }
    }

    return result;
  }

  /**
   * Set nested property in object using dot notation
   */
  private static setNestedProperty(obj: any, path: string, value: any): void {
    const parts = path.split(".");
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== "object") {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Calculate swimming pace (seconds per 100m)
   */
  static calculateSwimmingPace(metrics: SwimmingMetrics): number | null {
    if (!metrics.time || !metrics.distance) {
      return null;
    }

    return (metrics.time / metrics.distance) * 100;
  }

  /**
   * Calculate running pace (seconds per kilometer)
   */
  static calculateRunningPace(time: number, distance: number): number | null {
    if (!time || !distance) {
      return null;
    }

    return (time / distance) * 1000;
  }

  /**
   * Format time in seconds to human-readable format (MM:SS.ss)
   */
  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(2);

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.padStart(
      5,
      "0"
    )}`;
  }

  /**
   * Parse time string (MM:SS.ss) to seconds
   */
  static parseTime(timeString: string): number | null {
    const timeRegex = /^(\d{1,2}):(\d{2})\.(\d{2})$/;
    const match = timeString.match(timeRegex);

    if (!match) {
      return null;
    }

    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const centiseconds = parseInt(match[3], 10);

    return minutes * 60 + seconds + centiseconds / 100;
  }

  /**
   * Validate and sanitize JSONB input
   */
  static sanitizeJsonbInput(input: any): any {
    if (input === null || input === undefined) {
      return null;
    }

    if (typeof input === "string") {
      try {
        return JSON.parse(input);
      } catch {
        return null;
      }
    }

    if (typeof input === "object") {
      // Remove undefined values and functions
      return JSON.parse(JSON.stringify(input));
    }

    return input;
  }

  /**
   * Create search query for multiple JSONB fields
   */
  static createMultiFieldJsonbSearch(
    searches: Array<{
      field: string;
      path?: string;
      value: any;
      operator?: "equals" | "contains" | "gt" | "lt" | "gte" | "lte";
    }>
  ): any {
    const conditions: any[] = [];

    for (const search of searches) {
      const { field, path, value, operator = "equals" } = search;

      if (path) {
        conditions.push({
          [field]: {
            path: path.split("."),
            [operator]: value,
          },
        });
      } else {
        conditions.push({
          [field]: {
            [operator]: value,
          },
        });
      }
    }

    return conditions.length === 1 ? conditions[0] : { AND: conditions };
  }
}
