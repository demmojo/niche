import { Router, Request, Response } from 'express';
import express from 'express';
import { requireAuth, AuthenticatedRequest } from './authMiddleware';
import * as admin from 'firebase-admin';

export const superadminRouter = Router();

// Middleware to ensure user is superadmin
export const requireSuperadmin = async (req: Request, res: Response, next: express.NextFunction) => {
  try {
    const userReq = req as AuthenticatedRequest;
    const userId = userReq.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userRecord = await admin.auth().getUser(userId);
    if (!userRecord.customClaims?.superadmin) {
      // Check if maybe we define superadmin some other way? E.g., a whitelist
      const superadminEmails = process.env.SUPERADMIN_EMAILS ? process.env.SUPERADMIN_EMAILS.split(',') : [];
      if (!userRecord.email || !superadminEmails.includes(userRecord.email)) {
        return res.status(403).json({ error: 'Forbidden: Superadmin access required' });
      }
    }
    
    next();
  } catch (error) {
    console.error('Superadmin auth check failed:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Get Recent Active Users
superadminRouter.get('/users', requireAuth, requireSuperadmin, async (req: Request, res: Response) => {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('projects')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();
      
    const users: any[] = [];
    const seenUids = new Set<string>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.userId && !seenUids.has(data.userId)) {
        seenUids.add(data.userId);
        users.push({ uid: data.userId, projectId: doc.id, name: data.name || "Untitled Project" });
      }
    });

    return res.status(200).json({ users: users.slice(0, 10) });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Impersonate User
superadminRouter.post('/impersonate', requireAuth, requireSuperadmin, async (req: Request, res: Response) => {
  try {
    const { targetUid } = req.body;
    const userReq = req as AuthenticatedRequest;
    const adminUid = userReq.user?.uid;

    if (!adminUid || !targetUid) {
      return res.status(400).json({ error: 'Missing targetUid or adminUid' });
    }

    // 1. Verify target exists and is eligible for impersonation
    let targetUser;
    try {
      targetUser = await admin.auth().getUser(targetUid);
    } catch (e) {
      return res.status(404).json({ error: 'Target user not found' });
    }
    
    if (targetUser.customClaims?.superadmin) {
      return res.status(403).json({ error: "Cannot impersonate another admin." });
    }

    // 2. Mandatory Audit Logging
    await admin.firestore().collection('audit_logs').add({
      event: 'IMPERSONATION_STARTED',
      adminUid,
      targetUid,
      ipAddress: req.ip,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // 3. Create Custom Token with embedded Audit Claims
    const developerClaims = {
      isImpersonated: true,
      impersonatorUid: adminUid
    };
    
    // Custom tokens automatically expire in 1 hour
    const customToken = await admin.auth().createCustomToken(targetUid, developerClaims);

    return res.status(200).json({ token: customToken });
  } catch (error) {
    console.error('Failed to generate impersonation token:', error);
    return res.status(500).json({ error: 'Failed to generate token' });
  }
});
