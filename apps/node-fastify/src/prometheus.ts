import client from 'prom-client';

// Avoid duplicate metric registration across test runs or multiple app instances
function getOrCreateCounter(config: { name: string; help: string; labelNames?: string[] }) {
  const existing = client.register.getSingleMetric(config.name);
  return (existing as client.Counter) ?? new client.Counter(config);
}

function getOrCreateHistogram(config: { name: string; help: string; labelNames?: string[]; buckets?: number[] }) {
  const existing = client.register.getSingleMetric(config.name);
  return (existing as client.Histogram) ?? new client.Histogram(config);
}

const webhooksProcessedCounter = getOrCreateCounter({
  name: 'orb_sync_webhooks_processed_total',
  help: 'Total number of webhooks processed',
  labelNames: ['event'],
});

const webhookDelayMsHistogram = getOrCreateHistogram({
  name: 'orb_sync_webhook_delay_ms',
  help: 'Delay between when an event is emitted and when it is processed by the API in milliseconds',
  labelNames: ['event'],
});

const internalServerErrorsCounter = getOrCreateCounter({
  name: 'orb_sync_internal_server_errors_total',
  help: 'Total number of errors encountered',
});

export default {
  client,
  metrics: {
    webhooksProcessedCounter,
    webhookDelayMsHistogram,
    internalServerErrorsCounter,
  },
};
