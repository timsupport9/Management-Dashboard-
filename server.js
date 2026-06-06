const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ---------- Firebase Admin (using environment variables) ----------
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

// ---------- Helper Functions ----------
function getNextId() {
  return Date.now();
}

async function getAll(collection) {
  const snapshot = await db.collection(collection).get();
  return snapshot.docs.map(doc => ({ id: doc.data().id, ...doc.data() }));
}

async function create(collection, data) {
  const docId = getNextId().toString();
  const newDoc = { id: docId, ...data };
  await db.collection(collection).doc(docId).set(newDoc);
  return newDoc;
}

async function update(collection, id, data) {
  const snapshot = await db.collection(collection).where('id', '==', id).limit(1).get();
  if (snapshot.empty) throw new Error('Document not found');
  const docRef = snapshot.docs[0].ref;
  await docRef.update(data);
  const updated = await docRef.get();
  return { id: updated.data().id, ...updated.data() };
}

async function remove(collection, id) {
  const snapshot = await db.collection(collection).where('id', '==', id).limit(1).get();
  if (!snapshot.empty) {
    await snapshot.docs[0].ref.delete();
  }
}

// ---------- Authentication ----------
const VALID_PASSWORD = 'tim2024';

app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === VALID_PASSWORD) {
    res.json({ token: 'mock-jwt-token' });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// ---------- Error handling wrapper ----------
const asyncHandler = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch(err => {
    console.error(err);
    res.status(500).json({ error: err.message });
  });
};

// ---------- CRUD Endpoints (only showing a few – all are identical pattern) ----------
app.get('/api/experts', asyncHandler(async (req, res) => {
  res.json(await getAll('experts'));
}));
app.post('/api/experts', asyncHandler(async (req, res) => {
  const expert = await create('experts', req.body);
  res.json(expert);
}));
app.put('/api/experts/:id', asyncHandler(async (req, res) => {
  const expert = await update('experts', parseInt(req.params.id), req.body);
  res.json(expert);
}));
app.delete('/api/experts/:id', asyncHandler(async (req, res) => {
  await remove('experts', parseInt(req.params.id));
  res.status(204).send();
}));

// Events
app.get('/api/events', asyncHandler(async (req, res) => {
  res.json(await getAll('events'));
}));
app.post('/api/events', asyncHandler(async (req, res) => {
  const event = await create('events', req.body);
  res.json(event);
}));
app.put('/api/events/:id', asyncHandler(async (req, res) => {
  const event = await update('events', parseInt(req.params.id), req.body);
  res.json(event);
}));
app.delete('/api/events/:id', asyncHandler(async (req, res) => {
  await remove('events', parseInt(req.params.id));
  res.status(204).send();
}));

// Activities
app.get('/api/activities', asyncHandler(async (req, res) => {
  res.json(await getAll('activities'));
}));
app.post('/api/activities', asyncHandler(async (req, res) => {
  const activity = await create('activities', req.body);
  res.json(activity);
}));
app.put('/api/activities/:id', asyncHandler(async (req, res) => {
  const activity = await update('activities', parseInt(req.params.id), req.body);
  res.json(activity);
}));
app.delete('/api/activities/:id', asyncHandler(async (req, res) => {
  await remove('activities', parseInt(req.params.id));
  res.status(204).send();
}));

// Programs
app.get('/api/programs', asyncHandler(async (req, res) => {
  res.json(await getAll('programs'));
}));
app.post('/api/programs', asyncHandler(async (req, res) => {
  const program = await create('programs', req.body);
  res.json(program);
}));
app.put('/api/programs/:id', asyncHandler(async (req, res) => {
  const program = await update('programs', parseInt(req.params.id), req.body);
  res.json(program);
}));
app.delete('/api/programs/:id', asyncHandler(async (req, res) => {
  await remove('programs', parseInt(req.params.id));
  res.status(204).send();
}));

// Partners
app.get('/api/partners', asyncHandler(async (req, res) => {
  res.json(await getAll('partners'));
}));
app.post('/api/partners', asyncHandler(async (req, res) => {
  const partner = await create('partners', req.body);
  res.json(partner);
}));
app.put('/api/partners/:id', asyncHandler(async (req, res) => {
  const partner = await update('partners', parseInt(req.params.id), req.body);
  res.json(partner);
}));
app.delete('/api/partners/:id', asyncHandler(async (req, res) => {
  await remove('partners', parseInt(req.params.id));
  res.status(204).send();
}));

// Allocations
app.get('/api/allocations', asyncHandler(async (req, res) => {
  res.json(await getAll('allocations'));
}));
app.post('/api/allocations', asyncHandler(async (req, res) => {
  const alloc = await create('allocations', { ...req.body, date: new Date().toLocaleString() });
  res.json(alloc);
}));

// Logs
app.get('/api/logs', asyncHandler(async (req, res) => {
  const logs = await getAll('logs');
  logs.sort((a, b) => b.id - a.id);
  res.json(logs.slice(0, 200));
}));
app.post('/api/logs', asyncHandler(async (req, res) => {
  const log = await create('logs', { timestamp: new Date().toLocaleString(), ...req.body });
  res.json(log);
}));

// Event Registrations
app.get('/api/eventRegistrations', asyncHandler(async (req, res) => {
  res.json(await getAll('eventRegistrations'));
}));
app.post('/api/eventRegistrations', asyncHandler(async (req, res) => {
  const reg = await create('eventRegistrations', req.body);
  res.json(reg);
}));
app.patch('/api/eventRegistrations/:id/attend', asyncHandler(async (req, res) => {
  const reg = await update('eventRegistrations', parseInt(req.params.id), { attendance: 'Present' });
  res.json(reg);
}));

// Program Enrollments
app.get('/api/programEnrollments', asyncHandler(async (req, res) => {
  res.json(await getAll('programEnrollments'));
}));
app.post('/api/programEnrollments', asyncHandler(async (req, res) => {
  const enroll = await create('programEnrollments', { completed: false, ...req.body });
  res.json(enroll);
}));
app.patch('/api/programEnrollments/:id/complete', asyncHandler(async (req, res) => {
  const enroll = await update('programEnrollments', parseInt(req.params.id), { completed: true });
  res.json(enroll);
}));

// Applications
app.get('/api/applications/expert', asyncHandler(async (req, res) => {
  res.json(await getAll('expertApplications'));
}));
app.post('/api/applications/expert', asyncHandler(async (req, res) => {
  const appDoc = await create('expertApplications', req.body);
  res.json(appDoc);
}));
app.patch('/api/applications/expert/:id', asyncHandler(async (req, res) => {
  const appDoc = await update('expertApplications', parseInt(req.params.id), req.body);
  res.json(appDoc);
}));

app.get('/api/applications/corporate', asyncHandler(async (req, res) => {
  res.json(await getAll('corporateApplications'));
}));
app.post('/api/applications/corporate', asyncHandler(async (req, res) => {
  const appDoc = await create('corporateApplications', req.body);
  res.json(appDoc);
}));
app.patch('/api/applications/corporate/:id', asyncHandler(async (req, res) => {
  const appDoc = await update('corporateApplications', parseInt(req.params.id), req.body);
  res.json(appDoc);
}));

app.get('/api/applications/membership', asyncHandler(async (req, res) => {
  res.json(await getAll('membershipApplications'));
}));
app.post('/api/applications/membership', asyncHandler(async (req, res) => {
  const appDoc = await create('membershipApplications', req.body);
  res.json(appDoc);
}));
app.patch('/api/applications/membership/:id', asyncHandler(async (req, res) => {
  const appDoc = await update('membershipApplications', parseInt(req.params.id), req.body);
  res.json(appDoc);
}));

// Goals, KPIs, Projects
app.get('/api/goals', asyncHandler(async (req, res) => { res.json(await getAll('goals')); }));
app.post('/api/goals', asyncHandler(async (req, res) => { const goal = await create('goals', req.body); res.json(goal); }));
app.put('/api/goals/:id', asyncHandler(async (req, res) => { const goal = await update('goals', parseInt(req.params.id), req.body); res.json(goal); }));
app.delete('/api/goals/:id', asyncHandler(async (req, res) => { await remove('goals', parseInt(req.params.id)); res.status(204).send(); }));

app.get('/api/kpis', asyncHandler(async (req, res) => { res.json(await getAll('kpis')); }));
app.post('/api/kpis', asyncHandler(async (req, res) => { const kpi = await create('kpis', req.body); res.json(kpi); }));
app.put('/api/kpis/:id', asyncHandler(async (req, res) => { const kpi = await update('kpis', parseInt(req.params.id), req.body); res.json(kpi); }));
app.delete('/api/kpis/:id', asyncHandler(async (req, res) => { await remove('kpis', parseInt(req.params.id)); res.status(204).send(); }));

app.get('/api/projects', asyncHandler(async (req, res) => { res.json(await getAll('projects')); }));
app.post('/api/projects', asyncHandler(async (req, res) => { const project = await create('projects', req.body); res.json(project); }));
app.put('/api/projects/:id', asyncHandler(async (req, res) => { const project = await update('projects', parseInt(req.params.id), req.body); res.json(project); }));
app.delete('/api/projects/:id', asyncHandler(async (req, res) => { await remove('projects', parseInt(req.params.id)); res.status(204).send(); }));

// Bulk Import
app.post('/api/import', asyncHandler(async (req, res) => {
  const data = req.body;
  const collections = {
    experts: data.experts, events: data.events, activities: data.activities,
    programs: data.programs, partners: data.partners, allocations: data.allocations,
    logs: data.systemLogs, eventRegistrations: data.eventRegistrations,
    programEnrollments: data.programEnrollments, expertApplications: data.expertApplications,
    corporateApplications: data.corporateApplications, membershipApplications: data.membershipApplications,
    goals: data.goals, kpis: data.kpis, projects: data.projects,
  };
  for (const [collectionName, docs] of Object.entries(collections)) {
    if (docs && Array.isArray(docs) && docs.length) {
      const batch = db.batch();
      docs.forEach(doc => {
        const docRef = db.collection(collectionName).doc(doc.id?.toString() || getNextId().toString());
        if (!doc.id) doc.id = getNextId();
        batch.set(docRef, doc);
      });
      await batch.commit();
    }
  }
  res.json({ message: 'Import successful' });
}));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Firebase Firestore`);
});
