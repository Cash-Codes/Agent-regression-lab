import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { NewScenarioForm } from './new-scenario-form';

afterEach(() => {
  cleanup();
});

// The form imports the action; for unit tests we don't need the action to
// actually run — useActionState only invokes it on submit, and we don't submit.
// We mock it to avoid pulling in server-only modules (Prisma, next/cache).
vi.mock('@actions/actions', () => ({
  createScenarioAction: vi.fn(),
}));

describe('NewScenarioForm', () => {
  it('renders the name, description, tags, inputs, and fixtures fields', () => {
    render(<NewScenarioForm />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags (comma-separated)')).toBeInTheDocument();
    expect(screen.getByLabelText('Inputs (JSON)')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Fixtures (JSON, optional)'),
    ).toBeInTheDocument();
  });

  it('shows the Create scenario submit button', () => {
    render(<NewScenarioForm />);
    expect(
      screen.getByRole('button', { name: /Create scenario/i }),
    ).toBeInTheDocument();
  });
});
