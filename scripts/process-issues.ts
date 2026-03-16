/**
 * Process GitHub issues labeled 'auto-process' and apply changes to community-apis.json
 * or reported-issues.json. Runs as part of the sync workflow.
 *
 * Requires: GITHUB_TOKEN environment variable with repo scope.
 *
 * Field mapping (GitHub issue form → slugified key):
 *   "API Name"                      → api-name
 *   "API URL"                       → api-url
 *   "Description"                   → description
 *   "Category"                      → category
 *   "Authentication"                → authentication
 *   "HTTPS Support"                 → https-support
 *   "CORS Support"                  → cors-support
 *   "Problem Type"                  → problem-type
 *   "New URL"                       → new-url
 *   "Additional Details"            → additional-details
 *   "What needs to be updated?"     → what-needs-to-be-updated
 *   "New Auth Type"                 → new-auth-type
 *   "New HTTPS Status"              → new-https-status
 *   "New CORS Status"               → new-cors-status
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COMMUNITY_PATH = join(__dirname, '..', 'src', 'data', 'community-apis.json');
const ISSUES_PATH = join(__dirname, '..', 'src', 'data', 'reported-issues.json');

const REPO = process.env.GITHUB_REPOSITORY ?? 'BEKO2210/API_directory';
const TOKEN = process.env.GITHUB_TOKEN ?? '';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

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

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  labels: Array<{ name: string }>;
  created_at: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Parse a GitHub issue body rendered from a YAML form template.
 * GitHub renders each field as:
 *   ### Label
 *   <blank line>
 *   value
 *
 * We slugify the label and collect the value lines.
 */
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

/**
 * Normalize auth dropdown values to the format stored in the dataset.
 * Template options: "None (no authentication required)", "apiKey", "OAuth", etc.
 */
function normalizeAuth(raw: string | undefined): string {
  if (!raw) return '';
  const lower = raw.toLowerCase();
  if (lower.startsWith('none')) return '';
  // Return as-is for apiKey, OAuth, X-Mashape-Key, User-Agent
  return raw;
}

/**
 * Validate that a URL looks reasonable (starts with http/https).
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/*  GitHub API                                                         */
/* ------------------------------------------------------------------ */

async function githubApi(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<Response> {
  return fetch(`https://api.github.com/repos/${REPO}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

async function fetchIssues(): Promise<GitHubIssue[]> {
  if (!TOKEN) {
    console.log('No GITHUB_TOKEN set. Skipping issue processing.');
    return [];
  }

  const response = await githubApi('/issues?labels=auto-process&state=open&per_page=50');
  if (!response.ok) {
    console.warn(`Failed to fetch issues: HTTP ${response.status}`);
    return [];
  }

  return response.json();
}

async function closeIssue(issueNumber: number, comment: string): Promise<void> {
  if (!TOKEN) return;

  // Add comment
  await githubApi(`/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: { body: comment },
  });

  // Close issue and remove auto-process label
  await githubApi(`/issues/${issueNumber}`, {
    method: 'PATCH',
    body: { state: 'closed', state_reason: 'completed' },
  });

  // Remove auto-process label so it doesn't get re-processed if reopened
  await githubApi(`/issues/${issueNumber}/labels/auto-process`, {
    method: 'DELETE',
  });
}

async function commentOnIssue(issueNumber: number, comment: string): Promise<void> {
  if (!TOKEN) return;
  await githubApi(`/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: { body: comment },
  });
}

/* ------------------------------------------------------------------ */
/*  Process: New API                                                   */
/* ------------------------------------------------------------------ */

async function processNewApi(
  issue: GitHubIssue,
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

  // Validate required fields
  const missing: string[] = [];
  if (!name) missing.push('API Name');
  if (!link) missing.push('API URL');
  if (!description) missing.push('Description');
  if (!category) missing.push('Category');

  if (missing.length > 0) {
    console.log(`  Issue #${issue.number}: Missing required fields: ${missing.join(', ')}`);
    await commentOnIssue(
      issue.number,
      `Could not auto-process this submission. Missing required fields: **${missing.join(', ')}**.\n\nPlease update the issue with the missing information and add the \`auto-process\` label to retry.`,
    );
    return false;
  }

  // Validate URL
  if (!isValidUrl(link)) {
    console.log(`  Issue #${issue.number}: Invalid URL "${link}"`);
    await commentOnIssue(
      issue.number,
      `Could not auto-process this submission. The API URL \`${link}\` is not a valid HTTP/HTTPS URL.\n\nPlease correct the URL and add the \`auto-process\` label to retry.`,
    );
    return false;
  }

  // Validate description length
  if (description.length > 120) {
    console.log(`  Issue #${issue.number}: Description too long (${description.length} chars)`);
    await commentOnIssue(
      issue.number,
      `Could not auto-process this submission. The description is ${description.length} characters — please keep it under 100 characters.\n\nPlease shorten it and add the \`auto-process\` label to retry.`,
    );
    return false;
  }

  // Check for duplicate in community data
  const isDuplicateCommunity = community.add.some(
    (a) => a.name.toLowerCase() === name.toLowerCase() || a.link === link,
  );
  if (isDuplicateCommunity) {
    await closeIssue(
      issue.number,
      `**${name}** has already been submitted and is pending inclusion. Closing as duplicate. Thank you for contributing!`,
    );
    return false;
  }

  const authValue = normalizeAuth(auth);
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
    [
      `**${name}** has been added to the community API list!`,
      '',
      '| Field | Value |',
      '|:------|:------|',
      `| Name | ${name} |`,
      `| URL | ${link} |`,
      `| Category | ${category} |`,
      `| Auth | ${authValue || 'None'} |`,
      `| HTTPS | ${httpsValue ? 'Yes' : 'No'} |`,
      `| CORS | ${corsValue} |`,
      '',
      'It will appear on the website after the next build. Thank you for contributing!',
    ].join('\n'),
  );

  console.log(`  Issue #${issue.number}: Added new API "${name}" in ${category}`);
  return true;
}

/* ------------------------------------------------------------------ */
/*  Process: Broken API                                                */
/* ------------------------------------------------------------------ */

async function processBrokenApi(
  issue: GitHubIssue,
  reportedIssues: ReportedIssue[],
): Promise<boolean> {
  const fields = parseIssueBody(issue.body);
  const name = fields['api-name'];
  const problemType = fields['problem-type'];
  const newUrl = fields['new-url'];
  const details = fields['additional-details'] ?? '';

  if (!name) {
    console.log(`  Issue #${issue.number}: Missing API name, skipping`);
    await commentOnIssue(
      issue.number,
      'Could not auto-process this report. The **API Name** field is missing.\n\nPlease update the issue and add the `auto-process` label to retry.',
    );
    return false;
  }

  // Check for duplicate reports
  const existingReport = reportedIssues.find(
    (r) => r.api_name.toLowerCase() === name.toLowerCase() && r.status === 'open',
  );
  if (existingReport) {
    await closeIssue(
      issue.number,
      `**${name}** has already been reported in issue #${existingReport.issue_number}. We're tracking it. Thank you!`,
    );
    return false;
  }

  reportedIssues.push({
    issue_number: issue.number,
    type: problemType ?? 'unknown',
    api_name: name,
    details: [details, newUrl ? `New URL: ${newUrl}` : ''].filter(Boolean).join('\n'),
    created_at: issue.created_at,
    status: 'open',
  });

  await closeIssue(
    issue.number,
    [
      `Thank you for reporting the issue with **${name}**!`,
      '',
      `| Field | Value |`,
      `|:------|:------|`,
      `| API | ${name} |`,
      `| Problem | ${problemType ?? 'Not specified'} |`,
      newUrl ? `| New URL | ${newUrl} |` : '',
      '',
      'The report has been logged and will be reviewed. If the API has moved, the new URL will be updated in a future build.',
    ].filter(Boolean).join('\n'),
  );

  console.log(`  Issue #${issue.number}: Logged broken API report for "${name}" (${problemType})`);
  return true;
}

/* ------------------------------------------------------------------ */
/*  Process: Update API                                                */
/* ------------------------------------------------------------------ */

async function processUpdateApi(
  issue: GitHubIssue,
  community: CommunityData,
): Promise<boolean> {
  const fields = parseIssueBody(issue.body);
  const name = fields['api-name'];
  const newUrl = fields['new-url'];
  const newAuth = fields['new-auth-type'];
  const newHttps = fields['new-https-status'];
  const newCors = fields['new-cors-status'];

  if (!name) {
    console.log(`  Issue #${issue.number}: Missing API name, skipping`);
    await commentOnIssue(
      issue.number,
      'Could not auto-process this update. The **API Name** field is missing.\n\nPlease update the issue and add the `auto-process` label to retry.',
    );
    return false;
  }

  const updateFields: Record<string, string | boolean> = {};

  if (newUrl && isValidUrl(newUrl)) {
    updateFields.link = newUrl;
  }
  if (newAuth && newAuth !== 'No change') {
    updateFields.auth = normalizeAuth(newAuth);
  }
  if (newHttps && newHttps !== 'No change') {
    updateFields.https = newHttps.toLowerCase() === 'yes';
  }
  if (newCors && newCors !== 'No change') {
    updateFields.cors = newCors.toLowerCase();
  }

  if (Object.keys(updateFields).length === 0) {
    console.log(`  Issue #${issue.number}: No actionable update fields found for "${name}"`);
    await commentOnIssue(
      issue.number,
      `Could not auto-process this update for **${name}**. No changed fields were detected in the dropdowns.\n\nIf you described the changes only in the text field, a maintainer will review it manually. Otherwise, please re-submit with the correct dropdown selections and add the \`auto-process\` label.`,
    );
    return false;
  }

  community.update.push({
    name,
    fields: updateFields,
    source_issue: issue.number,
  });

  const changedFields = Object.entries(updateFields)
    .map(([k, v]) => `| ${k} | ${v} |`)
    .join('\n');

  await closeIssue(
    issue.number,
    [
      `Update for **${name}** has been recorded!`,
      '',
      '| Field | New Value |',
      '|:------|:----------|',
      changedFields,
      '',
      'The changes will be applied on the next build. Thank you!',
    ].join('\n'),
  );

  console.log(`  Issue #${issue.number}: Recorded update for "${name}" (${Object.keys(updateFields).join(', ')})`);
  return true;
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

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
    console.log(`\n  Processing #${issue.number}: "${issue.title}" [${labels.join(', ')}]`);

    try {
      if (labels.includes('new-api')) {
        if (await processNewApi(issue, community)) changed = true;
      } else if (labels.includes('broken-api')) {
        if (await processBrokenApi(issue, reportedIssues)) changed = true;
      } else if (labels.includes('update-api')) {
        if (await processUpdateApi(issue, community)) changed = true;
      } else {
        console.log(`    No matching label (new-api, broken-api, update-api), skipping`);
      }
    } catch (err) {
      console.error(`    Error processing #${issue.number}:`, err instanceof Error ? err.message : err);
    }
  }

  if (changed) {
    community.meta.lastUpdated = new Date().toISOString();
    writeFileSync(COMMUNITY_PATH, JSON.stringify(community, null, 2) + '\n', 'utf-8');
    writeFileSync(ISSUES_PATH, JSON.stringify(reportedIssues, null, 2) + '\n', 'utf-8');
    console.log('\nData files updated.');
  } else {
    console.log('\nNo changes to write.');
  }
}

main();
