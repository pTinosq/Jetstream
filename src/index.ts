export function greet(name: string): string {
  return `Hello, ${name}!`;
}

function main(): void {
  console.log(greet('Jetstream'));
}

// Run only when executed directly, not when imported.
if (import.meta.main) {
  main();
}
