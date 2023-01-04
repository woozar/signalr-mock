import * as express from 'express';
import { readFileSync } from 'fs';
import { createServer } from 'https';

const app = express();
app.use(express.json());

const httpPort = process.env.HTTP_PORT ?? '80';
const httpsPort = process.env.HTTPS_PORT ?? '443';
const silent = process.env.SILENT === 'true';

let data: Record<string, Record<string, any>> = {};

app.post('/api/v1/hubs/:hub/users/:user', (req, res) => {
  if (!silent) console.log(`Incoming message for hub: ${req.params.hub} user: ${req.params.user}`);
  if (!data[req.params.hub]) data[req.params.hub] = {};
  if (!data[req.params.hub][req.params.user]) data[req.params.hub][req.params.user] = [];
  data[req.params.hub][req.params.user].push(req.body);

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

app.post('/manage-api/clear', (_req, res) => {
  if (!silent) console.log('clear all messages');
  data = {};

  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({});
});

app.post('/manage-api/clear/hubs/:hub', (req, res) => {
  if (!silent) console.log(`clear all messages for hub: ${req.params.hub}`);
  delete data[req.params.hub];

  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({});
});

app.post('/manage-api/clear/hubs/:hub/users/:user', (req, res) => {
  if (!silent) console.log(`clear all messages for hub: ${req.params.hub} and user: ${req.params.user}`);
  delete data[req.params.hub]?.[req.params.user];

  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send({});
});

app.get('/manage-api/messages', (_req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send(data);
});

app.get('/manage-api/messages/hubs/:hub', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send(data[req.params.hub] ?? {});
});

app.get('/manage-api/messages/hubs/:hub/users/:user', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200);
  res.send(data[req.params.hub]?.[req.params.user] ?? []);
});

app.listen(httpPort, () => console.log(`SignalR Mock listen unencrypted on ${httpPort}`));

createServer({ key: readFileSync('server.key'), cert: readFileSync('server.cert') }, app).listen(httpsPort, () => {
  if (!silent) console.log(`SignalR Mock listen encrypted on ${httpsPort}`);
});
