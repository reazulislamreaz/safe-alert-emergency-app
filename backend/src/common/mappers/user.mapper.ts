import { User } from "@prisma/client";

export type PublicUser = Omit<
  User,
  "pinHash" | "passwordHash" | "phoneDigits" | "createdAt"
> & {
  createdAt: string;
};

export function toPublicUser(user: User): PublicUser {
  const { pinHash: _pin, passwordHash: _password, phoneDigits: _digits, ...safe } = user;
  return {
    ...safe,
    createdAt: user.createdAt.toISOString(),
  };
}
