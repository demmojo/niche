/**
 *
 */
export const deployToCloudflare = async (
  projectName: string,
): Promise<string[]> => {
  // Simulate API call delay
  await new Promise((res) => setTimeout(res, 1000));

  return [
    `> Initializing deployment for project: ${projectName}`,
    `> Authenticating with Cloudflare API... [OK]`,
    `> Fetching source code from artifact store... [OK]`,
    `> Resolving dependencies (npm ci)...`,
    `> Building project... (next build)`,
    `> Success! Generated static files in .next/server/pages`,
    `> Uploading artifacts to Cloudflare Pages...`,
    `> 124 files uploaded`,
    `> Provisioning edge workers...`,
    `> Updating routing tables...`,
    `> Attaching TLS certificates...`,
    `> Verifying DNS propagation... [OK]`,
    `> Deployment completed successfully!`,
  ];
};
