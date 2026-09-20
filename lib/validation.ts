export function validateEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return "Enter a valid email address.";
  }

  const email = value.trim();

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return "Enter a valid email address.";
  }

  return null;
}