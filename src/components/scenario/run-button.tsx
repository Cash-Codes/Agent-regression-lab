import { runScenarioAction } from '../../../app/scenarios/actions';
import { Button } from '../ui/button';

export function RunButton({ scenarioId }: { scenarioId: string }) {
  return (
    <form action={runScenarioAction}>
      <input type="hidden" name="scenarioId" value={scenarioId} />
      <Button type="submit">Run</Button>
    </form>
  );
}
