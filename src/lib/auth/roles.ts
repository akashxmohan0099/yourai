export type UserRole = 'owner' | 'admin' | 'staff' | 'viewer'

const roleHierarchy: Record<UserRole, number> = {
  owner: 4,
  admin: 3,
  staff: 2,
  viewer: 1,
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

export function canManageBusiness(role: UserRole): boolean {
  return hasRole(role, 'admin')
}

export function canViewData(role: UserRole): boolean {
  return hasRole(role, 'viewer')
}

export function canManageStaff(role: UserRole): boolean {
  return hasRole(role, 'owner')
}
