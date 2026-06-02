'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { prisma } from '@server/db/client';
import {
  parseTags,
  parseInputsJSON,
  parseFixturesJSON,
} from '@/lib/validation';

export type CreateScenarioState = { error: string | null };

export async function createScenarioAction(
  _prev: CreateScenarioState,
  formData: FormData,
): Promise<CreateScenarioState> {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || null;
  const tagsRaw = String(formData.get('tags') ?? '');
  const inputsRaw = String(formData.get('inputs') ?? '{}');
  const fixturesRaw = String(formData.get('fixtures') ?? '');

  if (!name) {
    return { error: 'name: required' };
  }
  if (name.length > 200) {
    return { error: 'name: too long (max 200 chars)' };
  }
  if (description && description.length > 1000) {
    return { error: 'description: too long (max 1000 chars)' };
  }

  let inputs: Record<string, unknown>;
  let fixtures: Record<string, unknown>;
  try {
    inputs = parseInputsJSON(inputsRaw);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
  try {
    fixtures = parseFixturesJSON(fixturesRaw);
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }

  const created = await prisma.scenario.create({
    data: {
      name,
      description,
      tags: parseTags(tagsRaw),
      inputs: inputs as never,
      fixtures:
        Object.keys(fixtures).length > 0 ? (fixtures as never) : undefined,
    },
  });

  revalidatePath('/scenarios');
  redirect(`/scenarios/${created.id}`);
}
