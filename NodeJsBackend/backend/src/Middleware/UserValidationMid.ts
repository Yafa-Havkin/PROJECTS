import { User } from "../DB_Service/Users/UserModel";

export function isStrong(password: string): boolean {
  if (password.length < 8) {
    return false;
  }
  if (!/^[a-zA-Z0-9]+$/.test(password)) {
    return false;
  }
  return true;
}

export async function isUnique(
  fieldSearch: string,
  value: string
): Promise<boolean> {
  const existingUser = await User.findOne({ [fieldSearch]: value });
  return !existingUser;
}
