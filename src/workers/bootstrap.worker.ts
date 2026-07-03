/// <reference lib="webworker" />
import { runBootstrap } from '@/features/scoring/bootstrap';
import type { Answers } from '@/features/scoring/types';

declare const self: DedicatedWorkerGlobalScope;

export interface BootstrapRequest {
  answers: Answers;
  replicates: number;
}

self.onmessage = (event: MessageEvent<BootstrapRequest>) => {
  const { answers, replicates } = event.data;
  const result = runBootstrap(answers, replicates);
  self.postMessage(result);
};
