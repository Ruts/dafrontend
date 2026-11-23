import { useEffect, useState } from 'react';

export function useWhatsAppService() {
  const [whatsapp, setWhatsapp] = useState('');
  const [setupError, setSetupError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    let active = true;

    async function load() {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE}/service-info`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('WhatsApp service details are unavailable.');
        const data = await response.json();
        if (typeof data.whatsappNumber !== 'string' || !/^[1-9]\d{7,14}$/.test(data.whatsappNumber)) {
          throw new Error('WhatsApp service number is not configured.');
        }
        if (active) setWhatsapp(data.whatsappNumber);
      } catch (error) {
        if (active) setSetupError(controller.signal.aborted
          ? 'WhatsApp details took too long to load. Please refresh or contact info@kromsystems.com.'
          : error instanceof Error ? error.message : 'Unable to load WhatsApp details.');
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void load();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  return { whatsapp, setupError };
}
