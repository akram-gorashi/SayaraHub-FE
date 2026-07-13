export enum AccountDeletionReason {
  NoLongerNeeded = 1,
  PrivacyConcerns = 2,
  TooManyNotifications = 3,
  BadExperience = 4,
  Other = 5,
}

export interface UserSettings {
  enableMessages: boolean;
  receiveEmailNotifications: boolean;
  hidePhoneNumber: boolean;
  receiveMessageNotifications: boolean;
  isProfilePrivate: boolean;
}

export type UpdateUserSettingsRequest = UserSettings;

export interface DeleteAccountRequest {
  reason: AccountDeletionReason | null;
  details?: string | null;
}
