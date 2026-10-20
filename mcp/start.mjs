#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.mjs';

const server = createServer();
await server.connect(new StdioServerTransport());
process.stdin.resume();
await new Promise(resolve => process.stdin.once('end', resolve));
