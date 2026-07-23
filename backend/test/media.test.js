/**
 * Integration tests for the media/document access layer.
 * Runs against the configured DB + MinIO. Creates its own fixtures and cleans up.
 *
 *   npm test
 */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import '../src/config/env.js';
import prisma from '../src/config/db.js';
import { MINIO_BUCKET } from '../src/config/minio.js';
import { putBuffer, removeObject } from '../src/services/storage.service.js';
import { userCanAccessMedia, guardDocumentAccess, resolveObjectKey } from '../src/services/media.service.js';

const stamp = Date.now();
const ctx = {};

before(async () => {
  ctx.objectKey = `test_media_${stamp}.pdf`;
  await putBuffer(ctx.objectKey, Buffer.from('%PDF-1.4 test'), 'application/pdf');

  ctx.media = await prisma.media.create({
    data: { bucketName: MINIO_BUCKET, objectKey: ctx.objectKey, originalName: ctx.objectKey, category: 'candidate_image' },
  });

  const mkUser = (role) => prisma.user.create({ data: { loginId: `test_${role}_${stamp}_${Math.round(performance.now())}`, passwordHash: 'x', role, status: 'approved' } });
  ctx.orgA = await mkUser('organization');
  ctx.orgB = await mkUser('organization');
  ctx.police = await mkUser('police');

  // orgA owns the media via a candidate verification
  ctx.verification = await prisma.candidateVerification.create({
    data: {
      organizationId: ctx.orgA.id, orgName: 'Test Org A', orgType: 'test', role: 'test',
      candidateName: 'Test Candidate', dob: new Date('2000-01-01'), phone: '0000000000',
      consent: true, candidateMediaId: ctx.media.id,
    },
  });
});

after(async () => {
  await prisma.candidateVerification.deleteMany({ where: { id: ctx.verification?.id } }).catch(() => {});
  await prisma.media.deleteMany({ where: { id: ctx.media?.id } }).catch(() => {});
  await prisma.user.deleteMany({ where: { id: { in: [ctx.orgA?.id, ctx.orgB?.id, ctx.police?.id].filter(Boolean) } } }).catch(() => {});
  await removeObject(ctx.objectKey).catch(() => {});
  await prisma.$disconnect();
});

test('owner org can access its own media', async () => {
  assert.equal(await userCanAccessMedia({ id: ctx.orgA.id, role: 'organization' }, ctx.media.id), true);
});

test('IDOR: a different org CANNOT access media it does not own', async () => {
  assert.equal(await userCanAccessMedia({ id: ctx.orgB.id, role: 'organization' }, ctx.media.id), false);
});

test('police (reviewer) can access any media', async () => {
  assert.equal(await userCanAccessMedia({ id: ctx.police.id, role: 'police' }, ctx.media.id), true);
});

test('guardDocumentAccess denies the non-owner org with 403', async () => {
  const res = await guardDocumentAccess({ id: ctx.orgB.id, role: 'organization' }, String(ctx.media.id));
  assert.equal(res.error?.status, 403);
});

test('guardDocumentAccess allows the owner and resolves the object key', async () => {
  const res = await guardDocumentAccess({ id: ctx.orgA.id, role: 'organization' }, String(ctx.media.id));
  assert.equal(res.objectKey, ctx.objectKey);
});

test('guardDocumentAccess rejects path traversal', async () => {
  const res = await guardDocumentAccess({ id: ctx.police.id, role: 'police' }, '../secret');
  assert.equal(res.error?.status, 403);
});

test('resolveObjectKey works with a numeric-string ref', async () => {
  assert.equal(await resolveObjectKey(String(ctx.media.id)), ctx.objectKey);
});

test('unknown media id resolves to null', async () => {
  assert.equal(await resolveObjectKey('99999999'), null);
});
