import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../permissions/permissions';

export interface RequiredPermission {
  permission: Permission;
  resourceOwnerIdField?: string;
}

// Decorator for marking routes as public (no authentication required)
export const Public = () => SetMetadata('isPublic', true);

// Decorator for specifying required roles
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Decorator for specifying required permissions
export const RequirePermissions = (...permissions: (Permission | RequiredPermission)[]) => {
  const normalizedPermissions = permissions.map((perm) =>
    typeof perm === 'string' ? { permission: perm } : perm,
  );
  return SetMetadata('permissions', normalizedPermissions);
};

// Decorator for requiring club context
export const RequireClub = () => SetMetadata('requireClub', true);

// Convenience decorators for common role combinations
export const AdminOnly = () => Roles('CLUB_ADMIN');

export const CoachOrAdmin = () => Roles('CLUB_ADMIN', 'COACH');

export const MedicalOrAdmin = () => Roles('CLUB_ADMIN', 'MEDICAL_STAFF');

export const AthleteOrParent = () => Roles('ATHLETE', 'PARENT');

// Convenience decorators for common permissions
export const CanViewAthletes = () => RequirePermissions(Permission.ATHLETES_READ);

export const CanManageAthletes = () =>
  RequirePermissions(
    Permission.ATHLETES_CREATE,
    Permission.ATHLETES_UPDATE,
    Permission.ATHLETES_DELETE,
  );

export const CanViewMedicalData = () => RequirePermissions(Permission.MEDICAL_READ);

export const CanManageTraining = () =>
  RequirePermissions(
    Permission.TRAINING_CREATE,
    Permission.TRAINING_UPDATE,
    Permission.TRAINING_ASSIGN,
  );

// Decorator for requiring ownership or specific permission
export const RequireOwnershipOr = (permission: Permission, ownerField = 'userId') =>
  RequirePermissions({ permission, resourceOwnerIdField: ownerField });
