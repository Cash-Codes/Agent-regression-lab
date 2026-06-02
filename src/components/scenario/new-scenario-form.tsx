'use client';

import { useActionState } from 'react';
import {
  createScenarioAction,
  type CreateScenarioState,
} from '../../../app/scenarios/actions';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

const INITIAL: CreateScenarioState = { error: null };

export function NewScenarioForm() {
  const [state, formAction, isPending] = useActionState(
    createScenarioAction,
    INITIAL,
  );

  return (
    <Card className="p-4">
      <h2 className="text-foreground text-sm font-semibold">New scenario</h2>
      <p className="text-muted mt-0.5 text-xs">
        Define inputs (messages or canned responses) and optional snapshot
        fixtures.
      </p>
      <form action={formAction} className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="name"
            className="text-muted block text-xs font-medium"
          >
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="border-border bg-background focus:border-accent mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none"
            placeholder="refund-flow"
          />
        </div>
        <div>
          <label
            htmlFor="description"
            className="text-muted block text-xs font-medium"
          >
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            className="border-border bg-background focus:border-accent mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none"
            placeholder="What does this scenario test?"
          />
        </div>
        <div>
          <label
            htmlFor="tags"
            className="text-muted block text-xs font-medium"
          >
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            className="border-border bg-background focus:border-accent mt-1 w-full rounded-md border px-3 py-1.5 text-sm focus:outline-none"
            placeholder="demo, refund"
          />
        </div>
        <div>
          <label
            htmlFor="inputs"
            className="text-muted block text-xs font-medium"
          >
            Inputs (JSON)
          </label>
          <textarea
            id="inputs"
            name="inputs"
            required
            rows={5}
            defaultValue={'{\n  "user": "hi"\n}'}
            className="border-border bg-background focus:border-accent mt-1 w-full rounded-md border px-3 py-1.5 font-mono text-xs focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="fixtures"
            className="text-muted block text-xs font-medium"
          >
            Fixtures (JSON, optional)
          </label>
          <textarea
            id="fixtures"
            name="fixtures"
            rows={3}
            placeholder="{}"
            className="border-border bg-background focus:border-accent mt-1 w-full rounded-md border px-3 py-1.5 font-mono text-xs focus:outline-none"
          />
        </div>
        {state.error ? (
          <p className="text-pill-eval-fail text-xs">{state.error}</p>
        ) : null}
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create scenario'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
