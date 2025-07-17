import type { AxiosRequestConfig } from 'axios';
import { request, lowcodeRequest } from './index';
import { getServiceForPath, isLowcodePath } from '../gateway';

/**
 * Smart API Router
 * 
 * Automatically routes API requests to the appropriate backend service
 * based on the request path.
 */

export interface SmartRequestConfig extends AxiosRequestConfig {
  /** Force use specific service */
  forceService?: 'baseSystem' | 'lowcodePlatform';
}

/**
 * Smart request function that automatically routes to the correct service
 */
export async function smartRequest<T = any>(config: SmartRequestConfig): Promise<T> {
  const { url = '', forceService, ...restConfig } = config;
  
  // Determine which service to use
  let useService: 'baseSystem' | 'lowcodePlatform';
  
  if (forceService) {
    useService = forceService;
  } else {
    useService = getServiceForPath(url);
  }
  
  // Route to appropriate service
  if (useService === 'lowcodePlatform') {
    return lowcodeRequest({ url, ...restConfig });
  } else {
    return request({ url, ...restConfig });
  }
}

/**
 * Smart request for low-code platform (convenience method)
 */
export async function lowcodeSmartRequest<T = any>(config: AxiosRequestConfig): Promise<T> {
  return smartRequest<T>({ ...config, forceService: 'lowcodePlatform' });
}

/**
 * Smart request for base system (convenience method)
 */
export async function baseSystemSmartRequest<T = any>(config: AxiosRequestConfig): Promise<T> {
  return smartRequest<T>({ ...config, forceService: 'baseSystem' });
}

/**
 * Create a smart request instance for a specific service
 */
export function createServiceRequest(service: 'baseSystem' | 'lowcodePlatform') {
  return async function<T = any>(config: AxiosRequestConfig): Promise<T> {
    return smartRequest<T>({ ...config, forceService: service });
  };
}

/**
 * Batch request handler for multiple services
 */
export async function batchSmartRequest<T = any>(
  requests: Array<SmartRequestConfig & { key: string }>
): Promise<Record<string, T>> {
  const promises = requests.map(async ({ key, ...config }) => {
    try {
      const result = await smartRequest<T>(config);
      return { key, result, error: null };
    } catch (error) {
      return { key, result: null, error };
    }
  });
  
  const results = await Promise.all(promises);
  
  return results.reduce((acc, { key, result, error }) => {
    if (error) {
      console.error(`Request failed for key ${key}:`, error);
      acc[key] = null as T;
    } else {
      acc[key] = result as T;
    }
    return acc;
  }, {} as Record<string, T>);
}

/**
 * Request interceptor for automatic service detection
 */
export function createSmartRequestInterceptor() {
  return {
    onRequest: (config: SmartRequestConfig) => {
      const service = config.forceService || getServiceForPath(config.url || '');
      
      // Add service info to headers for debugging
      if (import.meta.env.DEV) {
        config.headers = {
          ...config.headers,
          'X-Service-Route': service,
          'X-Is-Lowcode': isLowcodePath(config.url || '').toString()
        };
      }
      
      return config;
    },
    
    onResponse: (response: any) => {
      // Add service info to response for debugging
      if (import.meta.env.DEV) {
        response.serviceRoute = response.config?.headers?.['X-Service-Route'];
        response.isLowcode = response.config?.headers?.['X-Is-Lowcode'] === 'true';
      }
      
      return response;
    },
    
    onError: (error: any) => {
      // Add service context to error
      if (error.config) {
        error.serviceRoute = error.config.headers?.['X-Service-Route'];
        error.isLowcode = error.config.headers?.['X-Is-Lowcode'] === 'true';
      }
      
      return Promise.reject(error);
    }
  };
}

/**
 * Health check for all services
 */
export async function checkServicesHealth(): Promise<Record<string, boolean>> {
  const healthChecks = [
    {
      service: 'baseSystem',
      request: baseSystemSmartRequest({ url: '/health', method: 'GET' })
    },
    {
      service: 'lowcodePlatform', 
      request: lowcodeSmartRequest({ url: '/health', method: 'GET' })
    }
  ];
  
  const results: Record<string, boolean> = {};
  
  await Promise.all(
    healthChecks.map(async ({ service, request }) => {
      try {
        await request;
        results[service] = true;
      } catch {
        results[service] = false;
      }
    })
  );
  
  return results;
}
