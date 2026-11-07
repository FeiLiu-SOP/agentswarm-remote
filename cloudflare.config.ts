// Plain configuration is accepted by cf; no configuration package is needed.
export default {
  worker: {
    name: 'agentswarm-remote',
    entrypoint: './src/index.js',
    compatibilityDate: '2026-11-07',
    observability: {
      enabled: false,
      logs: { enabled: false, invocationLogs: false, persist: false },
      traces: { enabled: false, persist: false },
    },
  },
};
