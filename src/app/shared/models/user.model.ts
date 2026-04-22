export interface User {
  id: string;
  email: string;
  name: string;
}

// DTO for updating user profile
export interface UpdateProfileDto {
  name?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}
