import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import worker from '../src/index.js';

// Download the official schemas separately; fixture generation never contacts the site.
const directory = resolve(process.argv[2] ?? '/tmp/agentswarm-remote-validation');
await mkdir(directory, { recursive: true });
globalThis.fetch = async () => { throw new Error('Network disabled for schema fixtures.'); };
for (const [version, cardPath, schemaFile, definitions] of [
  ['current', 'agent-card.json', 'a2a-1.0.schema.json', '$defs'],
  ['legacy', 'agent.json', 'a2a-0.3.schema.json', 'definitions'],
]) {
  const current = version === 'current';
  const card = await (await worker.fetch(new Request(`https://edge.example/.well-known/${cardPath}`))).json();
  await writeFile(resolve(directory, `${version}-card.json`), JSON.stringify(card, null, 2) + '\n');
  const schema = JSON.parse(await readFile(resolve(directory, schemaFile), 'utf8'));
  for (const type of ['AgentCard', 'SendMessageResponse']) {
    await writeFile(resolve(directory, `${version}-${type}.schema.json`), JSON.stringify({ ...schema, $ref: `#/${definitions}/${type}` }, null, 2) + '\n');
  }
  const response = await (await worker.fetch(new Request('https://edge.example/a2a', {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(current ? { 'A2A-Version': '1.0' } : {}) },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: current ? 'SendMessage' : 'message/send', params: {
      message: { messageId: 'schema-check', role: current ? 'ROLE_USER' : 'user', parts: [{ ...(current ? {} : { kind: 'text' }), text: 'how to register' }] },
    } }),
  }))).json();
  if (response.error) throw new Error('Fixture generation failed.');
  await writeFile(resolve(directory, `${version}-response.json`), JSON.stringify(current ? response.result : response, null, 2) + '\n');
}
const server = await readFile(new URL('../server.json', import.meta.url), 'utf8');
await writeFile(resolve(directory, 'server.filled.json'), server.replaceAll('<SUBDOMAIN>', 'example'));
console.log(`Wrote local validation fixtures to ${directory}`);
