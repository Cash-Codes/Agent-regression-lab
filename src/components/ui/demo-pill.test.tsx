import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DemoPill } from './demo-pill';

describe('<DemoPill />', () => {
  let originalKey: string | undefined;

  beforeEach(() => {
    originalKey = process.env.ANTHROPIC_API_KEY;
  });

  afterEach(() => {
    if (originalKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalKey;
  });

  it('renders the pill when ANTHROPIC_API_KEY is unset', () => {
    delete process.env.ANTHROPIC_API_KEY;
    render(<DemoPill />);
    expect(screen.getByText('demo · mock LLM')).toBeInTheDocument();
  });

  it('renders the pill when ANTHROPIC_API_KEY is empty string', () => {
    process.env.ANTHROPIC_API_KEY = '';
    render(<DemoPill />);
    expect(screen.getByText('demo · mock LLM')).toBeInTheDocument();
  });

  it('renders nothing when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'sk-test-key';
    const { container } = render(<DemoPill />);
    expect(container.firstChild).toBeNull();
  });
});
