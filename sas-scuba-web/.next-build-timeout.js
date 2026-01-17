// Prevent infinite build loops by setting a timeout
// This file helps detect if build is stuck

const MAX_BUILD_TIME = 5 * 60 * 1000; // 5 minutes

let buildStartTime = Date.now();

process.on('SIGINT', () => {
  const elapsed = Date.now() - buildStartTime;
  if (elapsed > MAX_BUILD_TIME) {
    console.error('Build timeout exceeded. Exiting...');
    process.exit(1);
  }
});
