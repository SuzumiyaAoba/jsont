#!/usr/bin/env node
import { render } from 'ink';
import React from 'react';
import { App } from './App.js';

async function main() {
  let jsonData = null;

  if (!process.stdin.isTTY) {
    let input = '';
    process.stdin.setEncoding('utf8');

    for await (const chunk of process.stdin) {
      input += chunk;
    }

    if (input.trim()) {
      try {
        jsonData = JSON.parse(input);
      } catch (err) {
        console.error('Failed to parse JSON:', err);
        process.exit(1);
      }
    }
  }

  render(<App initialData={jsonData} />, {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
  });
}

main().catch(console.error);
