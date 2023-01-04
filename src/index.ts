import * as express from 'express';
import { readFileSync } from 'fs';
import { createServer } from 'https';

const app = express();
app.use(express.json());

const httpPort = process.env.HTTP_PORT ?? '80';
const httpsPort = process.env.HTTPS_PORT ?? '443';
const silent = process.env.SILENT === 'true';

let messages: Record<string, Record<string, any>> = {};

app.post('/api/v1/hubs/:hub/users/:user', (req, res) => {
  if (!silent) console.log(`Incoming message for hub: ${req.params.hub} user: ${req.params.user}`);
  if (!messages[req.params.hub]) messages[req.params.hub] = {};
  if (!messages[req.params.hub][req.params.user]) messages[req.params.hub][req.params.user] = [];
  messages[req.params.hub][req.params.user].push(req.body);

  res.status(200);
  res.send({});
});

app.get('/health', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({});
});

app.get('/manage-api/cert', (_req, res) => {
  res.setHeader('Content-Type', 'application/x-pem-file');
  res.status(200);
  res.send(readFileSync('server.cert'));
});

app.post('/manage-api/messages/clear', (_req, res) => {
  if (Object.keys(messages).length > 0) {
    if (!silent) console.log('clear all messages');
    messages = {};
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({});
});

app.post('/manage-api/messages/clear/hubs/:hub', (req, res) => {
  if (messages[req.params.hub]) {
    if (!silent) console.log(`clear all messages for hub: ${req.params.hub}`);
    delete messages[req.params.hub];
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({});
});

app.post('/manage-api/messages/clear/hubs/:hub/users/:user', (req, res) => {
  if (messages[req.params.hub]?.[req.params.user]) {
    if (!silent) console.log(`clear all messages for hub: ${req.params.hub} and user: ${req.params.user}`);
    delete messages[req.params.hub]?.[req.params.user];
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({});
});

app.get('/manage-api/messages', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send(messages);
});

app.get('/manage-api/messages/hubs/:hub', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send(messages[req.params.hub] ?? {});
});

app.get('/manage-api/messages/hubs/:hub/users/:user', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send(messages[req.params.hub]?.[req.params.user] ?? []);
});

app.listen(httpPort, () => console.log(`SignalR Mock listen unencrypted on ${httpPort}`));

createServer({ key: readFileSync('server.key'), cert: readFileSync('server.cert') }, app).listen(httpsPort, () => {
  if (!silent) console.log(`SignalR Mock listen encrypted on ${httpsPort}`);
});
