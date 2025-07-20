/**
 * API Gateway Configuration
 * 
 * This file manages the routing of different API requests to their respective backend services:
 * - Base system APIs (user management, auth, etc.) -> 9528 port
 * - Low-code platform APIs -> 3000 port
 */

export interface ServiceConfig {
  name: string;
  baseURL: string;
  prefix: string;
  description: string;
}

/**
 * Get service URLs based on environment
 */
function getServiceURLs() {
  const isDev = import.meta.env.DEV;
  const isProxy = isDev && import.meta.env.VITE_HTTP_PROXY === 'Y';

  return {
    baseSystem: isProxy ? '/proxy-default' : '/api',
    lowcodePlatform: isProxy ? '/proxy-lowcodeService' : '/lowcode-api'
  };
}

export const SERVICE_CONFIGS: Record<string, ServiceConfig> = {
  // Base system service (original soybean admin)
  baseSystem: {
    name: 'Base System',
    baseURL: getServiceURLs().baseSystem,
    prefix: '/v1',
    description: 'User management, authentication, permissions, etc.'
  },

  // Low-code platform service
  lowcodePlatform: {
    name: 'Low-code Platform',
    baseURL: getServiceURLs().lowcodePlatform,
    prefix: '/api',
    description: 'Low-code platform APIs for project, entity, field management, etc.'
  }
};

/**
 * Route patterns for different services
 */
export const ROUTE_PATTERNS = {
  // Base system routes (9528 port)
  baseSystem: [
    '/auth/**',
    '/user/**',
    '/role/**',
    '/menu/**',
    '/system/**',
    '/demo/**'
  ],
  
  // Low-code platform routes (3000 port)
  lowcodePlatform: [
    '/projects/**',
    '/entities/**',
    '/fields/**',
    '/relationships/**',
    '/api-configs/**',
    '/templates/**',
    '/queries/**',
    '/code-generation/**'
  ]
};

/**
 * Determine which service should handle a given API path
 */
export function getServiceForPath(path: string): 'baseSystem' | 'lowcodePlatform' {
  // Check low-code platform patterns first
  for (const pattern of ROUTE_PATTERNS.lowcodePlatform) {
    const regex = new RegExp(pattern.replace('**', '.*'));
    if (regex.test(path)) {
      return 'lowcodePlatform';
    }
  }
  
  // Default to base system
  return 'baseSystem';
}

/**
 * Get the appropriate base URL for a given API path
 */
export function getBaseURLForPath(path: string): string {
  const service = getServiceForPath(path);
  return SERVICE_CONFIGS[service].baseURL;
}

/**
 * Get service configuration by name
 */
export function getServiceConfig(serviceName: string): ServiceConfig | undefined {
  return SERVICE_CONFIGS[serviceName];
}

/**
 * List all available services
 */
export function getAllServices(): ServiceConfig[] {
  return Object.values(SERVICE_CONFIGS);
}

/**
 * Check if a path belongs to low-code platform
 */
export function isLowcodePath(path: string): boolean {
  return getServiceForPath(path) === 'lowcodePlatform';
}

/**
 * Check if a path belongs to base system
 */
export function isBaseSystemPath(path: string): boolean {
  return getServiceForPath(path) === 'baseSystem';
}
