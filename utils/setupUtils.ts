/**
 * Setup Agent Utilities
 * Helper functions for client deployment automation
 */

export interface DeploymentChecklist {
  preDeployment: ChecklistItem[]
  deployment: ChecklistItem[]
  postDeployment: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  title: string
  description: string
  critical: boolean
}

export const deploymentChecklist: DeploymentChecklist = {
  preDeployment: [
    {
      id: 'admin-ps',
      title: 'Run PowerShell as Administrator',
      description: 'Right-click PowerShell and select "Run as Administrator"',
      critical: true,
    },
    {
      id: 'backup',
      title: 'Backup Current Configuration',
      description: 'Create a full backup of the current server configuration',
      critical: true,
    },
    {
      id: 'disk-space',
      title: 'Verify Disk Space',
      description: 'Ensure at least 20GB free disk space available',
      critical: true,
    },
    {
      id: 'connectivity',
      title: 'Test Network Connectivity',
      description: 'Verify all client URLs are accessible',
      critical: false,
    },
    {
      id: 'firewall',
      title: 'Review Firewall Rules',
      description: 'Ensure firewall will allow required ports',
      critical: true,
    },
    {
      id: 'ssl-cert',
      title: 'Prepare SSL Certificates',
      description: 'Have .pfx certificate files ready',
      critical: false,
    },
  ],
  deployment: [
    {
      id: 'exec-policy',
      title: 'Set Execution Policy',
      description: 'Run Set-ExecutionPolicy command before script',
      critical: true,
    },
    {
      id: 'monitor-output',
      title: 'Monitor Script Output',
      description: 'Watch for errors and warnings during execution',
      critical: true,
    },
    {
      id: 'no-interrupt',
      title: 'Do Not Interrupt',
      description: 'Allow script to complete without interruption',
      critical: true,
    },
    {
      id: 'take-notes',
      title: 'Document Any Issues',
      description: 'Note any errors or warnings for troubleshooting',
      critical: false,
    },
  ],
  postDeployment: [
    {
      id: 'verify-services',
      title: 'Verify All Services Running',
      description: 'Check Windows Services for IIS, MongoDB, SQL Server, etc.',
      critical: true,
    },
    {
      id: 'test-urls',
      title: 'Test All URLs',
      description: 'Access each client URL in browser',
      critical: true,
    },
    {
      id: 'ssl-verify',
      title: 'Verify SSL Certificates',
      description: 'Check for certificate warnings',
      critical: false,
    },
    {
      id: 'logs-review',
      title: 'Review Installation Logs',
      description: 'Check for any errors in log files',
      critical: false,
    },
    {
      id: 'performance',
      title: 'Check System Performance',
      description: 'Monitor CPU, Memory, and Disk usage',
      critical: false,
    },
  ],
}

/**
 * Calculate estimated deployment time based on selected installations
 */
export function getEstimatedDeploymentTime(installations: string[]): {
  min: number
  max: number
  message: string
} {
  const installationTimes: Record<string, { min: number; max: number }> = {
    'Google Chrome': { min: 2, max: 5 },
    'URL Rewrite Module': { min: 3, max: 8 },
    'IIS Web Server': { min: 10, max: 15 },
    '.NET 8 Runtime': { min: 15, max: 30 },
    'Erlang OTP': { min: 5, max: 10 },
    'RabbitMQ Server': { min: 10, max: 20 },
    'MongoDB': { min: 15, max: 30 },
    'MongoDB Replica Set': { min: 20, max: 45 },
    'SQL Server 2017': { min: 45, max: 90 },
    'SSL Certificate': { min: 5, max: 10 },
    'Windows Hosts File': { min: 2, max: 5 },
    'IIS Site & App Pool': { min: 5, max: 15 },
    'Application Configuration': { min: 10, max: 20 },
  }

  let totalMin = 10 // Base setup time
  let totalMax = 20

  installations.forEach((inst) => {
    const times = installationTimes[inst]
    if (times) {
      totalMin += times.min
      totalMax += times.max
    }
  })

  return {
    min: totalMin,
    max: totalMax,
    message: `Estimated deployment time: ${totalMin}-${totalMax} minutes (depending on server performance)`,
  }
}

/**
 * Get deployment recommendations based on selected installations
 */
export function getDeploymentRecommendations(installations: string[]): string[] {
  const recommendations: string[] = []

  if (installations.length > 10) {
    recommendations.push(
      'Large number of installations selected - consider deploying in phases'
    )
  }

  if (installations.includes('SQL Server 2017')) {
    recommendations.push(
      'SQL Server requires significant resources - ensure sufficient RAM available'
    )
  }

  if (installations.includes('MongoDB Replica Set')) {
    recommendations.push(
      'Replica Set requires proper network configuration - test connectivity first'
    )
  }

  if (installations.includes('RabbitMQ Server')) {
    recommendations.push(
      'RabbitMQ should have dedicated resources - monitor performance during setup'
    )
  }

  if (!installations.includes('SSL Certificate')) {
    recommendations.push(
      'Consider adding SSL certificates for production security'
    )
  }

  return recommendations
}

/**
 * Format installation list for display
 */
export function formatInstallationList(installations: string[]): string {
  return installations.join(', ')
}

/**
 * Generate deployment summary
 */
export function generateDeploymentSummary(
  clientName: string,
  installations: string[],
  urls: { main: string; gateway: string; docs: string }
): string {
  const time = getEstimatedDeploymentTime(installations)
  return `
Deployment Summary for ${clientName}
=====================================
Total Installations: ${installations.length}
Estimated Time: ${time.message}

Client URLs:
  - Main: ${urls.main}
  - Gateway: ${urls.gateway}
  - Docs: ${urls.docs}

Ready to proceed with deployment.
  `
}
