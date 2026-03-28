import re

with open("src/server/campaignRoutes.ts", "r") as f:
    content = f.read()

# Add the import
content = content.replace(
    'import { getActionCredits, deductActionCredit } from "./credits";',
    'import { getActionCredits, deductActionCredit } from "./credits";\nimport { calculateTarpitScore } from "../utils/scoringEngine";'
)

# Add concurrency lock
concurrency_lock_code = """
    if (!Array.isArray(competitors) || competitors.length === 0) {
      return res.status(400).json({ error: "Competitors array is required." });
    }

    const db = admin.firestore();

    // 1.5 Server-Side Concurrency Lock
    const existingJobs = await db.collection("campaign_jobs")
      .where("userId", "==", userId)
      .where("status", "==", "processing")
      .get();

    if (!existingJobs.empty) {
      return res.status(429).json({
        error: "Too Many Requests",
        message: "You already have an analysis running. Please wait for it to complete."
      });
    }
"""
content = content.replace(
    """    if (!Array.isArray(competitors) || competitors.length === 0) {
      return res.status(400).json({ error: "Competitors array is required." });
    }""",
    concurrency_lock_code
)

# Remove `const db = admin.firestore();` before insert campaign_jobs
content = content.replace(
    """    // 2. Insert row/document into campaign_jobs (Firestore)
    const db = admin.firestore();
    const jobRef = await db.collection("campaign_jobs").add({""",
    """    // 2. Insert row/document into campaign_jobs (Firestore)
    const jobRef = await db.collection("campaign_jobs").add({"""
)

# Add the Tarpit Score calculation in runDeepValidationCampaign
calc_code_old = """  // Synchronous Vector Math using Float32Array (simulated here)
  const baseVector = new Float32Array(1536).fill(0.15);
  
  const scoredCompetitors = successfulEnrichments.map(comp => {
    const score = calculateCosineSimilarity(baseVector, comp.vector); // <1ms per iteration
    const jaccard = 0.5; // Mock jaccard
    const trueCompetitorScore = (0.6 * score) + (0.4 * jaccard);
    
    return {
      ...comp,
      trueCompetitorScore,
      // Remove raw vector before saving to Firestore to save space
      vector: undefined 
    };
  });

  // 3. Complete the campaign
  await jobRef.update({
    status: "completed",
    progress: safeCompetitors.length,
    results: scoredCompetitors,
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });"""

calc_code_new = """  // Synchronous Vector Math using Float32Array (simulated here)
  const baseVector = new Float32Array(1536).fill(0.15);
  
  let totalUniqueness = 0;

  const scoredCompetitors = successfulEnrichments.map(comp => {
    const similarity = calculateCosineSimilarity(baseVector, comp.vector); // <1ms per iteration
    const uniqueness = 1.0 - similarity;
    totalUniqueness += uniqueness;

    const jaccard = 0.5; // Mock jaccard
    const trueCompetitorScore = (0.6 * similarity) + (0.4 * jaccard);
    
    return {
      ...comp,
      trueCompetitorScore,
      // Remove raw vector before saving to Firestore to save space
      vector: undefined 
    };
  });

  const averageUniqueness = successfulEnrichments.length > 0 
    ? totalUniqueness / successfulEnrichments.length 
    : 1.0;

  const totalCompetitorCount = competitors.length; 
  const tarpitScore = calculateTarpitScore(averageUniqueness, totalCompetitorCount);

  // 3. Complete the campaign
  await jobRef.update({
    status: "completed",
    progress: safeCompetitors.length,
    results: scoredCompetitors,
    tarpitScore, // Save the calculated score
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });"""

content = content.replace(calc_code_old, calc_code_new)

with open("src/server/campaignRoutes.ts", "w") as f:
    f.write(content)
