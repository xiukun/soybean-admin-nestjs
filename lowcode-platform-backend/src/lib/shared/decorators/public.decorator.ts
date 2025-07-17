import { SetMetadata } from '@nestjs/common';

/**
 * Public decorator to mark endpoints as publicly accessible
 * (no authentication required)
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
