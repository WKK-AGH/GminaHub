import { Router } from 'express';

const router = Router();

router.post('/login', (_req, res) => {
  res.json({ message: 'Tutaj będzie logowanie' });
});

router.post('/register', (_req, res) => {
  res.json({ message: 'Tutaj będzie rejestracja radnych przez admina' });
});

router.post('/refresh', (_req, res) => {
  res.json({ message: 'Tutaj będzie odświeżanie tokenu JWT' });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Tutaj będzie wylogowanie (czyszczenie cookie)' });
});

export default router;
