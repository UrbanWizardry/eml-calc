import { Complex } from './complex';

const ONE = Complex.ONE;

/**
 * THE primitive operator: eml(x, y) = exp(x) - ln(y)
 * This is the ONLY function that directly uses Complex.exp and Complex.ln.
 * All other mathematical operations are built by composing this single function.
 */
export function eml(x: Complex, y: Complex): Complex {
  return Complex.exp(x).sub(Complex.ln(y));
}

// --- Level 1: Direct from eml ---

/** e = eml(1, 1) = exp(1) - ln(1) = e - 0 = e */
let _e: Complex | null = null;
export function emlE(): Complex {
  if (!_e) _e = eml(ONE, ONE);
  return _e;
}

/** exp(x) = eml(x, 1) = exp(x) - ln(1) = exp(x) - 0 = exp(x) */
export function emlExp(x: Complex): Complex {
  return eml(x, ONE);
}

// --- Level 2: Logarithm ---

/**
 * ln(x) = eml(1, eml(eml(1, x), 1))
 *
 * Derivation:
 *   eml(1, x) = e - ln(x)
 *   eml(e - ln(x), 1) = exp(e - ln(x)) = e^e / x
 *   eml(1, e^e/x) = e - ln(e^e/x) = e - e + ln(x) = ln(x)
 */
export function emlLn(x: Complex): Complex {
  return eml(ONE, eml(eml(ONE, x), ONE));
}

// --- Level 3: Zero and Subtraction ---

/**
 * 0 = eml(1, eml(e, 1))
 *   = e - ln(exp(e))
 *   = e - e = 0
 */
let _zero: Complex | null = null;
export function emlZero(): Complex {
  if (!_zero) _zero = eml(ONE, eml(emlE(), ONE));
  return _zero;
}

/**
 * x - y = eml(ln(x), exp(y))
 *       = exp(ln(x)) - ln(exp(y))
 *       = x - y
 */
export function emlSub(x: Complex, y: Complex): Complex {
  return eml(emlLn(x), emlExp(y));
}

// --- Level 4: Negation and Addition ---

/** -x = 0 - x = emlSub(0, x) */
export function emlNeg(x: Complex): Complex {
  return emlSub(emlZero(), x);
}

/** x + y = x - (-y) = emlSub(x, emlNeg(y)) */
export function emlAdd(x: Complex, y: Complex): Complex {
  return emlSub(x, emlNeg(y));
}

// --- Level 5: Multiplication and Division ---

/**
 * x * y = exp(ln(x) + ln(y))
 * Guard: if either operand is zero, return zero immediately.
 * This avoids ln(0) = -Infinity propagating through the chain
 * where subsequent emlLn(-Infinity) loses complex phase information.
 */
export function emlMul(x: Complex, y: Complex): Complex {
  if (x.magnitude < 1e-300 || y.magnitude < 1e-300) return Complex.ZERO;
  return emlExp(emlAdd(emlLn(x), emlLn(y)));
}

/**
 * x / y = exp(ln(x) - ln(y))
 * Guard: if numerator is zero, return zero immediately (same rationale as emlMul).
 */
export function emlDiv(x: Complex, y: Complex): Complex {
  if (x.magnitude < 1e-300) return Complex.ZERO;
  return emlExp(emlSub(emlLn(x), emlLn(y)));
}

// --- Level 6: Constants ---

let _two: Complex | null = null;
export function emlTwo(): Complex {
  if (!_two) _two = emlAdd(ONE, ONE);
  return _two;
}

let _half: Complex | null = null;
export function emlHalf(): Complex {
  if (!_half) _half = emlDiv(ONE, emlTwo());
  return _half;
}

let _negOne: Complex | null = null;
export function emlNegOne(): Complex {
  if (!_negOne) _negOne = emlNeg(ONE);
  return _negOne;
}

/**
 * i = exp(ln(-1) * 1/2)
 *
 * Since ln(-1) = ipi (principal branch), this gives exp(ipi/2) = i.
 *
 * HOWEVER: emlLn(-1) returns -ipi (the EML-compiled ln inverts the sign
 * due to branch cut interaction). So we compute i_raw = exp(-ipi/2) = -i,
 * then negate to get the correct +i.
 */
let _i: Complex | null = null;
export function emlI(): Complex {
  if (!_i) {
    const raw = emlExp(emlMul(emlLn(emlNegOne()), emlHalf()));
    // Correct sign: if imaginary part is negative, negate
    _i = raw.im < 0 ? emlNeg(raw) : raw;
  }
  return _i;
}

let _pi: Complex | null = null;
export function emlPi(): Complex {
  if (!_pi) {
    // pi = ln(-1) / i
    // Since emlLn(-1) = -ipi and emlI() = i:
    // -ipi / i = -pi, so we negate
    const raw = emlDiv(emlLn(emlNegOne()), emlI());
    _pi = raw.re < 0 ? emlNeg(raw) : raw;
  }
  return _pi;
}

// --- Level 7: Powers and Roots ---

/** x^y = exp(y * ln(x)) */
export function emlPow(base: Complex, exponent: Complex): Complex {
  return emlExp(emlMul(exponent, emlLn(base)));
}

/** sqrt(x) = x^(1/2) */
export function emlSqrt(x: Complex): Complex {
  return emlPow(x, emlHalf());
}

// --- Level 8: Trigonometric Functions ---

/**
 * sin(x) = (exp(ix) - exp(-ix)) / (2i)
 */
export function emlSin(x: Complex): Complex {
  const ix = emlMul(emlI(), x);
  const negIx = emlNeg(ix);
  return emlDiv(emlSub(emlExp(ix), emlExp(negIx)), emlMul(emlTwo(), emlI()));
}

/**
 * cos(x) = (exp(ix) + exp(-ix)) / 2
 */
export function emlCos(x: Complex): Complex {
  const ix = emlMul(emlI(), x);
  const negIx = emlNeg(ix);
  return emlDiv(emlAdd(emlExp(ix), emlExp(negIx)), emlTwo());
}

/** tan(x) = sin(x) / cos(x) */
export function emlTan(x: Complex): Complex {
  return emlDiv(emlSin(x), emlCos(x));
}
