// Audit module - placeholder for future audit functionality
export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class AuditService {
  // Future implementation for audit logging
}
