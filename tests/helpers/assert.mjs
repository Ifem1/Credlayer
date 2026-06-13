/** Minimal assertion helpers — throw with clear messages on failure */

export function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`Assert failed [${label}]: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

export function assertIn(actual, allowedSet, label) {
  if (!allowedSet.includes(actual)) {
    throw new Error(`Assert failed [${label}]: "${actual}" not in [${allowedSet.join(", ")}]`);
  }
}

export function assertGte(actual, min, label) {
  const a = Number(actual), m = Number(min);
  if (a < m) {
    throw new Error(`Assert failed [${label}]: ${a} < ${m}`);
  }
}

export function assertLte(actual, max, label) {
  const a = Number(actual), mx = Number(max);
  if (a > mx) {
    throw new Error(`Assert failed [${label}]: ${a} > ${mx}`);
  }
}

export function assertNonEmpty(val, label) {
  if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
    throw new Error(`Assert failed [${label}]: value is empty/null/undefined`);
  }
}

export function assertArray(val, label) {
  if (!Array.isArray(val)) {
    throw new Error(`Assert failed [${label}]: expected array, got ${typeof val}`);
  }
}

export function assertValidJson(str, label) {
  try {
    return JSON.parse(str);
  } catch {
    throw new Error(`Assert failed [${label}]: not valid JSON — ${str?.slice(0, 100)}`);
  }
}
