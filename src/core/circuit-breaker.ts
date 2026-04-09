type State = "closed" | "open" | "half-open";

const THRESHOLD = Number(process.env.CIRCUIT_BREAKER_THRESHOLD) || 5;
const COOLDOWN_MS = Number(process.env.CIRCUIT_BREAKER_COOLDOWN_MS) || 30_000;

interface CircuitState {
  state: State;
  failures: number;
  lastFailure: number;
}

const circuits = new Map<string, CircuitState>();

function getCircuit(key: string): CircuitState {
  let circuit = circuits.get(key);
  if (!circuit) {
    circuit = { state: "closed", failures: 0, lastFailure: 0 };
    circuits.set(key, circuit);
  }
  return circuit;
}

export function circuitBreakerCheck(key: string): { allowed: boolean } {
  const circuit = getCircuit(key);
  if (circuit.state === "closed") return { allowed: true };

  if (circuit.state === "open") {
    if (Date.now() - circuit.lastFailure >= COOLDOWN_MS) {
      circuit.state = "half-open";
      return { allowed: true };
    }
    return { allowed: false };
  }

  // half-open: allow one probe
  return { allowed: true };
}

export function circuitBreakerSuccess(key: string): void {
  const circuit = getCircuit(key);
  circuit.failures = 0;
  circuit.state = "closed";
}

export function circuitBreakerFailure(key: string): void {
  const circuit = getCircuit(key);
  circuit.failures++;
  circuit.lastFailure = Date.now();
  if (circuit.failures >= THRESHOLD) {
    circuit.state = "open";
  }
}

export class CircuitOpenError extends Error {
  constructor(key: string) {
    super(`Circuit breaker open for: ${key}`);
    this.name = "CircuitOpenError";
  }
}
