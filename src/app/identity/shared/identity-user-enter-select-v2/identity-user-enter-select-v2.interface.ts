export interface IdentityTypeOption {
  key: string;
  value: IdentityType;
}

export type IdentityType = 'existingUser' | 'newUser' | 'sshKey';
