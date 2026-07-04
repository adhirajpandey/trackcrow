export type DeviceTokenDto = {
  uuid: string;
  label: string | null;
  tokenPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
};

export type DeviceTokenListInput = {
  userUuid: string;
};

export type CreateDeviceTokenInput = {
  userUuid: string;
  label?: string;
};

export type RevokeDeviceTokenInput = {
  userUuid: string;
  tokenUuid: string;
};
