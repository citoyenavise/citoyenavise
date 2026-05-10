class SeededPRNG {
  constructor(seed = 42) {
    this._state = seed >>> 0;
  }

  next() {
    this._state = (this._state + 0x6D2B79F5) >>> 0;
    let z = this._state;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  }

  nextFloat() {
    return this.next();
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min)) + min;
  }

  nextNormal() {
    return this.next() - 0.5;
  }

  isAuthoritative() {
    return false;
  }

  getMetrics() {
    return Object.freeze({
      isAuthoritative: false,
      algorithm: 'Mulberry32',
      currentSeed: this._state,
      deterministic: true
    });
  }
}

module.exports = SeededPRNG;
