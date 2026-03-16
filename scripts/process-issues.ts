/**
 * Process GitHub issues labeled 'auto-process' and apply changes to community-apis.json
 * or reported-issues.json. Runs as part of the sync workflow.
 *
 * Requires: GITHUB_TOKEN environment variable with repo scope
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMUNITY_PATH = join(__dirname, '..', 'src', 'data', 'community-apis.json');
const ISSUES_PATH = join(__dirname, '..', 'src', 'data', 'reported-issues.json');

const REPO = process.env.GITHUB_REPOSITORY ?? 'BEKO2210/API_directory';
const TOKEN = process.env.GITHUB_TOKEN ?? '';

interface CommunityData {
  meta: { description: string; lastUpdated: string };
  add: Array<{
    name: string;
    link: string;
    description: string;
    category: string;
    auth: string;
    https: boolean;
    cors: string;
    source_issue: number;
  }>;
  remove: Array<{ name: string; reason: string; source_issue: number }>;
  update: Array<{
    name: string;
    fields: Record<string, string | boolean>;
    source_issue: number;
  }>;
}

interface ReportedIssue {
  issue_number: number;
  type: string;
  api_name: string;
  details: string;
  created_at: string;
  status: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseIssueBody(body: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const lines = body.split('\n');
  let currentKey = '';

  for (const line of lines) {
    const headerMatch = line.match(/^###\s+(.+)/);
    if (headerMatch) {
      currentKey = slugify(headerMatch[1].trim());
      continue;
    }

    if (currentKey && line.trim() && line.trim() !== '_No response_') {
      if (fields[currentKey]) {
        fields[currentKey] += '\n' + line.trim();
      } else {
        fields[currentKey] = line.trim();
      }
    }
  }

  return fields;
}

async function fetchIssues(): Promise<
  Array<{ number: number; title: string; body: string; labels: Array<{ name: string }>; created_at: string }>
> {
  if (!TOKEN) {
    console.log('No GITHUB_TOKEN set. Skipping issue processing.');
    return [];
  }

  const url = `https://api.github.com/repos/${REPO}/issues?labels=auto-process&state=open&per_page=50`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    console.warn(`Failed to fetch issues: HTTP ${response.status}`);
    return [];
  }

  return response.json();
}

async function closeIssue(issueNumber: number, comment: string): Promise<void> {
  if (!TOKEN) return;

  // Add comment
  await fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}/comments`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body: comment }),
  });

  // Close issue
  await fetch(`https://api.github.com/repos/${REPO}/issues/${issueNumber}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state: 'closed' }),
  });
}

async function processNewApi(
  issue: { number: number; body: string; created_at: string },
  community: CommunityData,
): Promise<boolean> {
  const fields = parseIssueBody(issue.body);

  const name = fields['api-name'];
  const link = fields['api-url'];
  const description = fields['description'];
  const category = fields['category'];
  const auth = fields['authentication'];
  const https = fields['https-support'];
  const cors = fields['cors-support'];

  if (!name || !link || !description || !category) {
    console.log(`  Issue #${issue.number}: Missing required fields, skipping auto-process`);
    return false;
  }

  // Check for duplicate
  const isDuplicate = community.add.some(
    (a) => a.name.toLowerCase() === name.toLowerCase() || a.link === link,
  );
  if (isDuplicate) {
    await closeIssue(
      issue.number,
      `This API (${name}) has already been submitted. Closing as duplicate. Thank you for contributing!`,
    );
    return false;
  }

  const authValue = auth === 'None' ? '' : auth ?? '';
  const httpsValue = https?.toLowerCase() === 'yes';
  const corsValue = (cors ?? 'unknown').toLowerCase();

  community.add.push({
    name,
    link,
    description,
    category,
    auth: authValue,
    https: httpsValue,
    cors: corsValue,
    source_issue: issue.number,
  });

  await closeIssue(
    issue.number,
    `**${name}** has been added to the community API list! It will appear on the website after the next build. Thank you for contributing!`,
  );

  console.log(`  Issue #${issue.number}: Added new API "${name}" to community list`);
  return true;
}

async function processBrokenApi(
  issue: { number: number; body: string; title: string; created_at: string },
  reportedIssues: ReportedIssue[],
): Promise<boolean> {
  const fields = parseIssueBody(issue.body);
  const name = fields['api-name'];
  const issueType = fields['whats-wrong'];
  const details = fields['additional-details'] ?? '';

  if (!name) {
    console.log(`  Issue #${issue.number}: Missing API name, skipping`);
    return false;
  }

  // Check for duplicate reports
  const isDuplicate = reportedIssues.some(
    (r) => r.api_name.toLowerCase() === name.toLowerCase() && r.status === 'open',
  );
  if (isDuplicate) {
    await closeIssue(
      issue.number,
      `This API (${name}) has already been reported. We're tracking it. Thank you!`,
    );
    return false;
  }

  reportedIssues.push({
    issue_number: issue.number,
    type: issueType ?? 'unknown',
    api_name: name,
    details,
    created_at: issue.created_at,
    status: 'open',
  });

  await closeIssue(
    issue.number,
    `Thank you for reporting the issue with **${name}**! We've logged it and will review it. The report is tracked in our system.`,
  );

  console.log(`  Issue #${issue.number}: Logged broken API report for "${name}"`);
  return true;
}

async function processUpdateApi(
  issue: { number: number; body: string; created_at: string },
  community: CommunityData,
): Promise<boolean> {
  const fields = parseIssueBody(issue.body);
  const name = fields['api-name'];
  const newUrl = fields['new-url-if-applicable'];
  const newAuth = fields['new-auth-type-if-changed'];
  const newHttps = fields['new-https-status-if-changed'];
  const newCors = fields['new-cors-status-if-changed'];

  if (!name) {
    console.log(`  Issue #${issue.number}: Missing API name, skipping`);
    return false;
  }

  const updateFields: Record<string, string | boolean> = {};

  if (newUrl && newUrl !== '_No response_') updateFields.link = newUrl;
  if (newAuth && newAuth !== 'No change') updateFields.auth = newAuth === 'None' ? '' : newAuth;
  if (newHttps && newHttps !== 'No change') updateFields.https = newHttps.toLowerCase() === 'yes';
  if (newCors && newCors !== 'No change') updateFields.cors = newCors.toLowerCase();

  if (Object.keys(updateFields).length === 0) {
    console.log(`  Issue #${issue.number}: No actionable update fields found`);
    return false;
  }

  community.update.push({
    name,
    fields: updateFields,
    source_issue: issue.number,
  });

  const changedFields = Object.keys(updateFields).join(', ');
  await closeIssue(
    issue.number,
    `Update for **${name}** (${changedFields}) has been recorded! It will be applied on the next build. Thank you!`,
  );

  console.log(`  Issue #${issue.number}: Recorded update for "${name}" (${changedFields})`);
  return true;
}

async function main(): Promise<void> {
  console.log('Processing GitHub issues...');

  const issues = await fetchIssues();
  if (issues.length === 0) {
    console.log('No open issues to process.');
    return;
  }

  console.log(`Found ${issues.length} issue(s) to process.`);

  const community: CommunityData = JSON.parse(readFileSync(COMMUNITY_PATH, 'utf-8'));
  const reportedIssues: ReportedIssue[] = JSON.parse(readFileSync(ISSUES_PATH, 'utf-8'));

  let changed = false;

  for (const issue of issues) {
    const labels = issue.labels.map((l) => l.name);

    if (labels.includes('new-api')) {
      const result = await processNewApi(issue, community);
      if (result) changed = true;
    } else if (labels.includes('broken-api')) {
      const result = await processBrokenApi(issue, reportedIssues);
      if (result) changed = true;
    } else if (labels.includes('update-api')) {
      const result = await processUpdateApi(issue, community);
      if (result) changed = true;
    } else {
      console.log(`  Issue #${issue.number}: No matching label, skipping`);
    }
  }

  if (changed) {
    community.meta.lastUpdated = new Date().toISOString();
    writeFileSync(COMMUNITY_PATH, JSON.stringify(community, null, 2), 'utf-8');
    writeFileSync(ISSUES_PATH, JSON.stringify(reportedIssues, null, 2), 'utf-8');
    console.log('Data files updated.');
  } else {
    console.log('No changes to write.');
  }
}

main();
