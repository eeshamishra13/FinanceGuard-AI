async function run() {
  const r1 = await fetch('http://localhost:3000/');
  console.log('Route / HTTP Status:', r1.status);
  const r2 = await fetch('http://localhost:3000/simulator');
  console.log('Route /simulator HTTP Status:', r2.status);
  const r3 = await fetch('http://localhost:3000/copilot');
  console.log('Route /copilot HTTP Status:', r3.status);
  const html = await r1.text();
  console.log('Verified Title in HTML:', html.includes('FinanceGuard'));
}
run();