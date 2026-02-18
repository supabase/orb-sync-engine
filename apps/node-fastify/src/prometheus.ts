import client from 'prom-client';

const webhooksProcessedCounter = new client.Counter({
  name: 'orb_sync_webhooks_processed_total',
  help: 'Total number of webhooks processed',
  labelNames: ['event'],
});

const webhookDelayMsHistogram = new client.Histogram({
  name: 'orb_sync_webhook_delay_ms',
  help: 'Delay between when an event is emitted and when it is processed by the API in milliseconds',
  labelNames: ['event'],
});

const internalServerErrorsCounter = new client.Counter({
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
