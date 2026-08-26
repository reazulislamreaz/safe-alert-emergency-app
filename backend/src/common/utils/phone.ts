export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Figma profile header mask, e.g. +880 189* **** */
export function maskPhone(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.length < 4) {
    return phone;
  }
  const keep = Math.min(6, digits.length - 2);
  let seen = 0;
  let result = "";
  for (const char of phone) {
    if (/\d/.test(char)) {
      result += seen < keep ? char : "*";
      seen += 1;
    } else {
      result += char;
    }
  }
  return result;
}
