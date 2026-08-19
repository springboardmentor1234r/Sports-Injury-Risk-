import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiBaseUrl } from './constants.js';

test('normalizes /api URLs to /api/v1', () => {
  assert.equal(normalizeApiBaseUrl('http://localhost:8000/api'), 'http://localhost:8000/api/v1');
});

test('keeps existing /api/v1 URL unchanged', () => {
  assert.equal(normalizeApiBaseUrl('http://localhost:8000/api/v1'), 'http://localhost:8000/api/v1');
});

test('strips trailing slashes before normalizing', () => {
  assert.equal(normalizeApiBaseUrl('http://localhost:8000/api/'), 'http://localhost:8000/api/v1');
});

test('uses the default backend URL when none is provided', () => {
  assert.equal(normalizeApiBaseUrl(), 'http://localhost:8000/api/v1');
});
