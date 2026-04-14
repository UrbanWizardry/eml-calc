/**
 * Immutable complex number class for EML calculations.
 * Handles IEEE754 edge cases: infinities, signed zeros, NaN propagation.
 */
export class Complex {
  readonly re: number;
  readonly im: number;

  constructor(re: number, im: number) {
    this.re = re;
    this.im = im;
  }

  static readonly ZERO = new Complex(0, 0);
  static readonly ONE = new Complex(1, 0);
  static readonly I = new Complex(0, 1);

  static from(re: number): Complex {
    return new Complex(re, 0);
  }

  add(other: Complex): Complex {
    return new Complex(this.re + other.re, this.im + other.im);
  }

  sub(other: Complex): Complex {
    return new Complex(this.re - other.re, this.im - other.im);
  }

  mul(other: Complex): Complex {
    // (a+bi)(c+di) = (ac-bd) + (ad+bc)i
    return new Complex(
      this.re * other.re - this.im * other.im,
      this.re * other.im + this.im * other.re,
    );
  }

  div(other: Complex): Complex {
    // (a+bi)/(c+di) = ((ac+bd) + (bc-ad)i) / (c^2+d^2)
    const denom = other.re * other.re + other.im * other.im;
    return new Complex(
      (this.re * other.re + this.im * other.im) / denom,
      (this.im * other.re - this.re * other.im) / denom,
    );
  }

  neg(): Complex {
    return new Complex(-this.re, -this.im);
  }

  get magnitude(): number {
    return Math.hypot(this.re, this.im);
  }

  get arg(): number {
    return Math.atan2(this.im, this.re);
  }

  isReal(tolerance = 1e-10): boolean {
    return Math.abs(this.im) < tolerance;
  }

  /**
   * Complex exponential: exp(a+bi) = e^a * (cos(b) + i*sin(b))
   * Handles: exp(-Inf + 0i) = 0+0i (IEEE754 compliant)
   */
  static exp(z: Complex): Complex {
    const ea = Math.exp(z.re);
    if (ea === 0) return Complex.ZERO;
    if (!isFinite(ea) && z.im === 0) return new Complex(ea, 0);
    return new Complex(ea * Math.cos(z.im), ea * Math.sin(z.im));
  }

  /**
   * Complex natural logarithm (principal branch): ln(a+bi) = ln|z| + i*arg(z)
   * arg in (-pi, pi]
   * Handles: ln(0+0i) = -Inf+0i (IEEE754 compliant)
   * Handles: ln(-1+0i) = 0+pi*i (principal branch)
   */
  static ln(z: Complex): Complex {
    const mag = z.magnitude;
    if (mag === 0) return new Complex(-Infinity, 0);
    return new Complex(Math.log(mag), z.arg);
  }

  toString(): string {
    if (this.im === 0) return String(this.re);
    if (this.re === 0) return `${this.im}i`;
    const sign = this.im >= 0 ? '+' : '-';
    return `${this.re}${sign}${Math.abs(this.im)}i`;
  }
}
