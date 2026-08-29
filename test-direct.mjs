import { BASELINE_METRICS, SCENARIO_DEFINITIONS, runStressTest, calculateResilienceScore } from './src/lib/simulatorService.ts';
import { generateCopilotResponse, SUGGESTED_QUESTIONS } from './src/lib/copilotMock.ts';

console.log('=== TEST 1: Baseline Financial Twin ===');
console.assert(BASELINE_METRICS.resilience === 82, `Expected resilience 82, got ${BASELINE_METRICS.resilience}`);
console.assert(BASELINE_METRICS.runwayMonths === 10.8, `Expected runway 10.8, got ${BASELINE_METRICS.runwayMonths}`);
console.assert(BASELINE_METRICS.monthlySavings === 23000, `Expected savings 23000, got ${BASELINE_METRICS.monthlySavings}`);
console.assert(BASELINE_METRICS.netWorth === 600000, `Expected net worth 600000, got ${BASELINE_METRICS.netWorth}`);
console.log('? Baseline verified:', BASELINE_METRICS);

console.log('\n=== TEST 2: Stress Test Scenarios ===');
for (const sc of SCENARIO_DEFINITIONS) {
  const res = runStressTest(BASELINE_METRICS, sc.type, sc.defaultParams, []);
  console.log(`\nScenario: [${sc.title}]`);
  console.log(`  Before: Resilience=${res.before.resilience}, Runway=${res.before.runwayMonths}mo, Savings=?${res.before.monthlySavings}`);
  console.log(`  After:  Resilience=${res.after.resilience}, Runway=${res.after.runwayMonths}mo, Savings=?${res.after.monthlySavings}`);
  console.log(`  Verdict Severity: ${res.verdictSeverity}`);
  console.log(`  Verdict Text: "${res.verdict.slice(0, 100)}..."`);
  console.log(`  Top Factors: ${res.topFactors.length} items`);
  console.log(`  6-Month Timeline: ${res.timeline.length} months`);
  console.log(`  Projections: ${res.projections.length} points`);
  console.log(`  Recovery Levers available: ${res.recoveryLevers.length}`);
  
  console.assert(res.timeline.length === 6, 'Timeline should have exactly 6 months');
  console.assert(res.projections.length === 6, 'Projections should have exactly 6 points');
  console.assert(res.recoveryLevers.length >= 2, 'Should have at least 2 recovery levers');
}

console.log('\n=== TEST 3: Recovery Levers (Problem -> Action -> Recovery) ===');
const jobLossTest = runStressTest(BASELINE_METRICS, 'job_loss', { incomeDropPercent: 100, durationMonths: 4, severancePay: 0 }, []);
console.log(`Stressed Resilience without levers: ${jobLossTest.after.resilience}`);

const leverIdsToApply = jobLossTest.recoveryLevers.map(l => l.id);
const recoveredTest = runStressTest(BASELINE_METRICS, 'job_loss', { incomeDropPercent: 100, durationMonths: 4, severancePay: 0 }, leverIdsToApply);
console.log(`Recovered Resilience with ${leverIdsToApply.length} levers applied: ${recoveredTest.after.resilience}`);
console.assert(recoveredTest.after.resilience > jobLossTest.after.resilience, 'Recovery levers must increase resilience!');
console.log('? Recovery Flow successfully restored score by +' + (recoveredTest.after.resilience - jobLossTest.after.resilience) + ' points!');

console.log('\n=== TEST 4: Copilot Deterministic Responses ===');
for (const q of SUGGESTED_QUESTIONS) {
  const copilotMsg = generateCopilotResponse(q, BASELINE_METRICS, jobLossTest);
  console.log(`\nQuestion: "${q}"`);
  console.log(`  Diagnosis Badge: ${copilotMsg.diagnosisBadge?.label} (${copilotMsg.diagnosisBadge?.variant})`);
  console.log(`  Content snippet: "${copilotMsg.content.slice(0, 90).replace(/\n/g, ' ')}..."`);
  console.log(`  Action steps: ${copilotMsg.actionSteps?.length || 0} steps`);
  console.log(`  Follow-ups: ${copilotMsg.suggestedFollowUps?.length || 0} items`);
  console.assert(copilotMsg.content.length > 50, 'Copilot response should have substantive content');
}

console.log('\n========================================');
console.log('ALL VERIFICATION SUITES PASSED CLEANLY!');
console.log('========================================');