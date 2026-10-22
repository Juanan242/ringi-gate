#!/usr/bin/env node
// Entry point of the ringi command; see docs/cli.md.
import { main } from '../scripts/ringi-cli.mjs';

process.exitCode = await main(process.argv.slice(2));
