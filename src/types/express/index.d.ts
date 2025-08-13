type AuthUser = {
  id: string;
  phoneNumber: string | null;
  name?: string | null;
  role: UserRole;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export {};
