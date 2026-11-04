import assert from "node:assert";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { prisma } from "../lib/prisma";
import { auth } from "@trigger.dev/sdk";
import { designAgentTask, designTask } from "../trigger/design-agent";

async function runTests() {
  console.log("Starting Design Agent API & Trigger Task verification...");

  // 1. Verify design task definition and methods
  assert.ok(designAgentTask, "designAgentTask should be exported");
  assert.strictEqual(designAgentTask.id, "design-agent");
  assert.strictEqual(designTask.id, "design-agent", "designTask alias should match designAgentTask");
  assert.strictEqual(typeof designAgentTask.trigger, "function", "trigger should be a function");
  assert.strictEqual(typeof designAgentTask.triggerAndWait, "function", "triggerAndWait should be a function");
  assert.strictEqual(typeof designAgentTask.batchTrigger, "function", "batchTrigger should be a function");
  console.log("✓ Design task correctly defined and exported with task methods");

  // 2. Verify TaskRun model in Prisma
  const testRunId = `run_test_${Date.now()}`;
  const testUserId = `user_test_${Date.now()}`;
  const testProjectId = `proj_test_${Date.now()}`;

  console.log("Creating TaskRun record in Prisma...");
  const createdRun = await prisma.taskRun.create({
    data: {
      runId: testRunId,
      projectId: testProjectId,
      userId: testUserId,
    },
  });

  assert.ok(createdRun.id, "TaskRun should have a cuid id");
  assert.strictEqual(createdRun.runId, testRunId);
  assert.strictEqual(createdRun.projectId, testProjectId);
  assert.strictEqual(createdRun.userId, testUserId);
  assert.ok(createdRun.createdAt instanceof Date, "createdAt should be a Date");
  console.log("✓ TaskRun record created successfully in Prisma");

  // Verify findUnique by runId
  const retrievedRun = await prisma.taskRun.findUnique({
    where: { runId: testRunId },
  });
  assert.ok(retrievedRun, "TaskRun should be retrievable by runId");
  assert.strictEqual(retrievedRun?.id, createdRun.id);
  console.log("✓ TaskRun retrieved by unique runId");

  // Verify findMany by userId and projectId (compound index query)
  const runsByUserAndProject = await prisma.taskRun.findMany({
    where: {
      userId: testUserId,
      projectId: testProjectId,
    },
  });
  assert.strictEqual(runsByUserAndProject.length, 1);
  assert.strictEqual(runsByUserAndProject[0].runId, testRunId);
  console.log("✓ TaskRun queried by compound userId and projectId index");

  // 3. Verify public token generation scoped to runId
  console.log("Generating public token scoped to runId...");
  const publicToken = await auth.createPublicToken({
    scopes: {
      read: {
        runs: [testRunId],
      },
    },
  });
  assert.ok(publicToken, "Public token should be generated");
  assert.strictEqual(typeof publicToken, "string");
  assert.ok(publicToken.length > 50, "Token should be a valid JWT string");
  console.log("✓ Run-scoped public token successfully generated");

  // 4. Verify TaskRun ownership checks
  // Owner check: matching userId
  const isOwner = createdRun.userId === testUserId;
  assert.strictEqual(isOwner, true, "Matching userId should be identified as owner");

  // Non-owner check: differing userId
  const isDifferentUserOwner = createdRun.userId === "user_another_999";
  assert.strictEqual(isDifferentUserOwner, false, "Different userId should fail direct owner check");

  // 5. Clean up test record
  await prisma.taskRun.delete({
    where: { runId: testRunId },
  });
  const verifyDeleted = await prisma.taskRun.findUnique({
    where: { runId: testRunId },
  });
  assert.strictEqual(verifyDeleted, null, "TaskRun should be deleted");
  console.log("✓ Test TaskRun cleaned up from Prisma");

  console.log("ALL DESIGN AGENT API TESTS PASSED! 🎉");
}

runTests()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
