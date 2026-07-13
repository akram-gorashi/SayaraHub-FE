export interface UserProfile {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  imageUrl: string | null;
  roles: string[];
}

export interface PublicUserProfile {
  id: number;
  fullName: string;
  phoneNumber: string | null;
  imageUrl: string | null;
}

export interface UpdateUserProfileRequest {
  fullName: string;
  phoneNumber?: string | null;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserImageResult {
  imageUrl: string;
}
