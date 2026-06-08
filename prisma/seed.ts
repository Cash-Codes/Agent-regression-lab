import 'dotenv/config';
import { prisma } from '../src/server/db/client';
import { runScenario } from '../src/server/runner/runner';
import {
  GOOD_INPUTS,
  BAD_INPUTS,
  REFUND_FIXTURES,
  ASSERTIONS,
} from './seed/refund-data';

async function main() {
  console.log('arl seed: clearing prior seed-demo data...');
  await prisma.scenario.deleteMany({
    where: { tags: { has: 'seed-demo' } },
  });

  console.log('arl seed: creating scenario...');
  const scenario = await prisma.scenario.create({
    data: {
      name: 'Refund flow',
      description: 'Customer support agent handling a refund request',
      tags: ['seed-demo', 'demo'],
      inputs: GOOD_INPUTS as never,
      fixtures: REFUND_FIXTURES as never,
      assertions: ASSERTIONS as never,
    },
  });

  console.log('arl seed: Run 1 — baseline (all-pass expected)...');
  await runScenario({
    scenarioId: scenario.id,
    seed: 42,
    label: 'baseline',
  });

  console.log('arl seed: Run 2 — replay verification (identical to Run 1)...');
  await runScenario({
    scenarioId: scenario.id,
    seed: 42,
    label: 'replay verification',
  });

  console.log('arl seed: mutating scenario to broken prompt...');
  await prisma.scenario.update({
    where: { id: scenario.id },
    data: { inputs: BAD_INPUTS as never },
  });

  console.log('arl seed: Run 3 — broken prompt (regression expected)...');
  await runScenario({
    scenarioId: scenario.id,
    seed: 99,
    label: 'broken prompt',
  });

  console.log(`✓ Seeded scenario ${scenario.id} with 3 runs.`);
  console.log('  open /scenarios to see the demo.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
