export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  isActive: boolean;
  isPlatformAdmin: boolean;
  sessionId: string;
  viewingClinicId: string | null;
}

export interface CurrentMembership {
  clinicId: string;
  clinicName: string;
  clinicSlug: string;
  roleName: string;
  status: string;
  toolAccess?: { toolSlug: string; level: string }[];
}
