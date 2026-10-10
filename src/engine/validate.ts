import type { Protocol, Step } from './types';

/**
 * Checks that every branch in a protocol points at a real step.
 * Runs at load time, so a typo in a protocol file fails loudly instead of mid-emergency.
 */
export function validateProtocol(protocol: Protocol): Protocol {
  const errors: string[] = [];
  const ids = new Set<string>();

  if (protocol.steps.length === 0) errors.push('Protocol has no steps');
  if (!(protocol.maxDoses >= 0)) errors.push('maxDoses must be 0 or more');

  for (const step of protocol.steps) {
    if (ids.has(step.id)) errors.push(`Duplicate step id "${step.id}"`);
    ids.add(step.id);
  }

  const check = (from: string, target: string | undefined, label: string) => {
    if (target !== undefined && !ids.has(target)) {
      errors.push(`Step "${from}" ${label} points to unknown step "${target}"`);
    }
  };

  const checkAnswer = (from: string, value: string | undefined, label: string) => {
    if (value !== undefined && value !== 'yes' && value !== 'no') {
      errors.push(`Step "${from}" ${label} must be "yes" or "no", not "${value}"`);
    }
  };

  protocol.steps.forEach((step: Step, i) => {
    const hasFollowing = i + 1 < protocol.steps.length;
    switch (step.kind) {
      case 'info':
      case 'dose':
      case 'wait':
        check(step.id, step.next, 'next');
        if (step.next === undefined && !hasFollowing) errors.push(`Step "${step.id}" has nowhere to go next`);
        break;
      case 'question':
        check(step.id, step.onYes, 'onYes');
        check(step.id, step.onNo, 'onNo');
        if ((step.onYes === undefined || step.onNo === undefined) && !hasFollowing) {
          errors.push(`Step "${step.id}" has nowhere to go on one of its answers`);
        }
        checkAnswer(step.id, step.recommended, 'recommended');
        break;
      case 'checkin':
        check(step.id, step.onYes, 'onYes');
        check(step.id, step.onNo, 'onNo');
        check(step.id, step.onNoDosesLeft, 'onNoDosesLeft');
        break;
      case 'end':
        break;
      default:
        errors.push(`Step "${(step as Step).id}" has unknown kind "${(step as { kind: string }).kind}"`);
    }
    step.variants?.forEach((v) => v.when.anyYes?.forEach((id) => check(step.id, id, 'variant condition')));
  });

  if (errors.length > 0) {
    throw new Error(`Invalid protocol "${protocol.id}":\n- ${errors.join('\n- ')}`);
  }
  return protocol;
}
