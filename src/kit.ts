// Proposed manual-fallback kit layout (demo.md §4). Bay contents follow the planning doc's bay table.
export interface Bay {
  number: number;
  name: string;
  /** Fits inside the bay on the diagram. Defaults to `name`. */
  short?: string;
  color: string;
}

export const BAYS: Bay[] = [
  { number: 1, name: 'Life Threat', color: '#e5484d' },
  { number: 2, name: 'Diagnostics', color: '#3e7bfa' },
  { number: 3, name: 'Trauma / Burn', color: '#f5a524' },
  { number: 4, name: 'First Aid / Pharma', short: 'First Aid', color: '#30a46c' },
  { number: 5, name: 'PPE / Tools', color: '#8b949e' },
  { number: 6, name: 'VR headset', color: '#8e4ec6' },
];
