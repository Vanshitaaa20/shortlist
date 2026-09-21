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

export function validateIdea(title: unknown, body: unknown): string | null {
  if (typeof title !== "string" || title.trim().length < 1 || title.trim().length > 100) {
    return "Title must be between 1 and 100 characters.";
  }

  if (typeof body !== "string" || body.trim().length < 1 || body.trim().length > 1000) {
    return "Body must be between 1 and 1000 characters.";
  }

  return null;
}