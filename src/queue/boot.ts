let started = false;
export async function startWorkerOnce() {
  if (started) return;
  started = true;
  await import("./worker");
}
