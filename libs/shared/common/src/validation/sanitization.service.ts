import { Injectable } from "@nestjs/common";
import * as DOMPurify from "isomorphic-dompurify";
import * as validator from "validator";

export interface SanitizationOptions {
  allowedTags?: string[];
  allowedAttributes?: string[];
  stripTags?: boolean;
  maxLength?: number;
  allowHtml?: boolean;
}

@Injectable()
export class SanitizationService {
  private readonly defaultOptions: SanitizationOptions = {
    allowedTags: [], // No HTML tags allowed by default
    allowedAttributes: [],
    stripTags: true,
    maxLength: 1000,
    allowHtml: false,
  };

  sanitizeString(input: string, options: SanitizationOptions = {}): string {
    if (!input || typeof input !== "string") {
      return "";
    }

    const opts = { ...this.defaultOptions, ...options };

    // Trim whitespace
    let sanitized = input.trim();

    // Apply length limit
    if (opts.maxLength && sanitized.length > opts.maxLength) {
      sanitized = sanitized.substring(0, opts.maxLength);
    }

    // Escape HTML entities if HTML is not allowed
    if (!opts.allowHtml) {
      sanitized = validator.escape(sanitized);
    } else {
      // Strip or sanitize HTML
      if (opts.stripTags) {
        sanitized = DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: opts.allowedTags || [],
          ALLOWED_ATTR: opts.allowedAttributes || [],
        });
      }
    }

    // Remove potential SQL injection patterns
    sanitized = this.sanitizeSqlInjection(sanitized);

    // Remove script injection attempts
    sanitized = this.sanitizeScriptInjection(sanitized);

    return sanitized;
  }

  sanitizeObject<T extends Record<string, any>>(
    obj: T,
    options: SanitizationOptions = {}
  ): T {
    if (!obj || typeof obj !== "object") {
      return obj;
    }

    const sanitized = { ...obj } as any;

    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === "string") {
        sanitized[key] = this.sanitizeString(value, options);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item) =>
          typeof item === "string"
            ? this.sanitizeString(item, options)
            : typeof item === "object" && item !== null
              ? this.sanitizeObject(item, options)
              : item
        );
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeObject(value, options);
      }
    }

    return sanitized as T;
  }

  // Sports platform specific sanitization for training data
  sanitizeTrainingData(data: any): any {
    return this.sanitizeObject(data, {
      maxLength: 500,
      stripTags: true,
      allowedTags: [], // No HTML in training data
      allowHtml: false,
    });
  }

  // Sanitization for club information (allows basic formatting)
  sanitizeClubData(data: any): any {
    return this.sanitizeObject(data, {
      maxLength: 2000,
      stripTags: false,
      allowedTags: ["b", "i", "em", "strong", "p", "br"], // Basic formatting for descriptions
      allowedAttributes: [],
      allowHtml: true,
    });
  }

  // Sanitization for athlete data
  sanitizeAthleteData(data: any): any {
    return this.sanitizeObject(data, {
      maxLength: 1000,
      stripTags: true,
      allowedTags: [], // No HTML in athlete data
      allowHtml: false,
    });
  }

  // Sanitization for user input (comments, messages)
  sanitizeUserInput(data: any): any {
    return this.sanitizeObject(data, {
      maxLength: 1500,
      stripTags: false,
      allowedTags: ["b", "i", "em", "strong"], // Basic formatting only
      allowedAttributes: [],
      allowHtml: true,
    });
  }

  // Validate and sanitize email
  sanitizeEmail(email: string): string {
    if (!email || typeof email !== "string") {
      return "";
    }

    const sanitized =
      validator.normalizeEmail(email.trim().toLowerCase()) || "";
    return validator.isEmail(sanitized) ? sanitized : "";
  }

  // Validate and sanitize phone number
  sanitizePhoneNumber(phone: string): string {
    if (!phone || typeof phone !== "string") {
      return "";
    }

    // Remove all non-digit characters except + for international prefix
    return phone.replace(/[^\d+]/g, "");
  }

  private sanitizeSqlInjection(input: string): string {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
      /(--|\/\*|\*\/|;)/g,
      /(\b(OR|AND)\s+\w+\s*=\s*\w+)/gi,
      /(\bunion\s+(all\s+)?select)/gi,
    ];

    let sanitized = input;
    sqlPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "");
    });

    return sanitized;
  }

  private sanitizeScriptInjection(input: string): string {
    const scriptPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
    ];

    let sanitized = input;
    scriptPatterns.forEach((pattern) => {
      sanitized = sanitized.replace(pattern, "");
    });

    return sanitized;
  }
}
