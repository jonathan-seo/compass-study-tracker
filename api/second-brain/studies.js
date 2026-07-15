import { timingSafeEqual } from 'node:crypto';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  enrichStudy,
  sanitizeStudyChanges,
  studyIdentity,
} from '../_lib/study-contract.js';

const COLLECTION = 'ministry_studies';

function getDb() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Firebase Admin environment variables are not configured.');
    }

    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
  }
  return getFirestore();
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left || '');
  const rightBuffer = Buffer.from(right || '');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorized(req) {
  const expected = process.env.SECOND_BRAIN_SYNC_TOKEN;
  const authorization = req.headers.authorization || '';
  const supplied = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return Boolean(expected) && safeEqual(expected, supplied);
}

function parseBody(req) {
  if (!req.body) return {};
  return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
}

function toJsonValue(value) {
  if (value?.toDate instanceof Function) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(toJsonValue);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, toJsonValue(child)]));
  }
  return value;
}

function documentToStudy(document) {
  return { id: document.id, ...toJsonValue(document.data()) };
}

function send(res, status, payload) {
  res.status(status).json(payload);
}

async function listStudies(req, res) {
  const snapshot = await getDb().collection(COLLECTION).get();
  let studies = snapshot.docs.map(documentToStudy).map(enrichStudy);

  const ministryYear = req.query.ministryYear;
  if (ministryYear) studies = studies.filter((study) => study.ministryYear === ministryYear);
  if (req.query.needsAction === 'true') studies = studies.filter((study) => study.needsAction);

  studies.sort((left, right) => {
    const dateOrder = String(left.startDate || '').localeCompare(String(right.startDate || ''));
    return dateOrder || String(left.title || '').localeCompare(String(right.title || ''));
  });

  send(res, 200, {
    generatedAt: new Date().toISOString(),
    ministryYear: ministryYear || null,
    count: studies.length,
    studies,
  });
}

async function createStudy(req, res, body) {
  const { changes, errors } = sanitizeStudyChanges(body.study, { creating: true });
  if (errors.length) return send(res, 400, { errors });

  const snapshot = await getDb().collection(COLLECTION).get();
  const identity = studyIdentity(changes);
  const match = snapshot.docs.map(documentToStudy).find((study) => studyIdentity(study) === identity);
  if (match) return send(res, 409, { error: 'A matching study already exists.', study: enrichStudy(match) });

  if (body.apply !== true) {
    return send(res, 200, { dryRun: true, operation: 'create', proposed: enrichStudy(changes) });
  }

  const now = new Date().toISOString();
  const created = { ...changes, createdAt: now, updatedAt: now, updatedBy: 'second-brain' };
  const reference = await getDb().collection(COLLECTION).add(created);
  return send(res, 201, { dryRun: false, operation: 'create', study: enrichStudy({ id: reference.id, ...created }) });
}

async function updateStudy(req, res, body) {
  if (!body.id || typeof body.id !== 'string') return send(res, 400, { error: 'id is required.' });
  const { changes, errors } = sanitizeStudyChanges(body.changes);
  if (errors.length) return send(res, 400, { errors });
  if (!Object.keys(changes).length) return send(res, 400, { error: 'At least one writable change is required.' });

  const db = getDb();
  const reference = db.collection(COLLECTION).doc(body.id);

  if (body.apply !== true) {
    const snapshot = await reference.get();
    if (!snapshot.exists) return send(res, 404, { error: 'Study not found.' });
    const current = documentToStudy(snapshot);
    return send(res, 200, {
      dryRun: true,
      operation: 'update',
      current: enrichStudy(current),
      proposed: enrichStudy({ ...current, ...changes }),
    });
  }

  const updatedAt = new Date().toISOString();
  const updated = await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists) {
      const error = new Error('Study not found.');
      error.status = 404;
      throw error;
    }

    const current = documentToStudy(snapshot);
    if (body.expectedUpdatedAt && current.updatedAt && body.expectedUpdatedAt !== current.updatedAt) {
      const error = new Error('The study changed after it was read.');
      error.status = 409;
      error.study = enrichStudy(current);
      throw error;
    }

    transaction.update(reference, { ...changes, updatedAt, updatedBy: 'second-brain' });
    return enrichStudy({ ...current, ...changes, updatedAt, updatedBy: 'second-brain' });
  });

  return send(res, 200, { dryRun: false, operation: 'update', study: updated });
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Allow', 'GET, POST, PATCH');

  if (!isAuthorized(req)) return send(res, 401, { error: 'Unauthorized.' });

  try {
    if (req.method === 'GET') return await listStudies(req, res);
    const body = parseBody(req);
    if (req.method === 'POST') return await createStudy(req, res, body);
    if (req.method === 'PATCH') return await updateStudy(req, res, body);
    return send(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    if (error.status) {
      return send(res, error.status, {
        error: error.message,
        ...(error.study ? { study: error.study } : {}),
      });
    }
    console.error('Second Brain study bridge error:', error);
    return send(res, 500, { error: 'Study bridge request failed.' });
  }
}
