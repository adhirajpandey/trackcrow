export type MeDto = {
  uuid: string;
  id: number;
  email: string;
  name: string;
  image: string | null;
  subscription: number;
};

export type EnsureUserBootstrapInput = {
  email: string;
  name: string;
  image?: string | null;
  provider: string;
};

export type GetMeInput = {
  userUuid: string;
};
