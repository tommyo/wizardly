import { defineStore } from 'pinia';
import { useWizard } from './useWizard';
import type { WizardConfig } from '@/types';

export default (id: string, config: WizardConfig) => defineStore(id, () => {
  const wizard = useWizard(config.questions);
  return { ...wizard };
});
