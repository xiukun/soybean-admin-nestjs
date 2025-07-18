/**
 * Interface for code template structure
 */
export interface CodeTemplate {
  /**
   * File path relative to output directory
   */
  path: string;

  /**
   * File content
   */
  content: string;

  /**
   * File type (e.g., 'typescript', 'javascript', 'json', 'yaml')
   */
  type?: string;

  /**
   * Whether to overwrite existing file
   */
  overwrite?: boolean;

  /**
   * File permissions (for Unix systems)
   */
  permissions?: string;

  /**
   * Template metadata
   */
  metadata?: {
    /**
     * Template name
     */
    templateName?: string;

    /**
     * Generated timestamp
     */
    generatedAt?: Date;

    /**
     * Template version
     */
    version?: string;

    /**
     * Template description
     */
    description?: string;

    /**
     * Template author
     */
    author?: string;

    /**
     * Template tags
     */
    tags?: string[];
  };
}

/**
 * Interface for template generation context
 */
export interface TemplateContext {
  /**
   * Project information
   */
  project: {
    name: string;
    description?: string;
    version?: string;
    author?: string;
  };

  /**
   * Entities to generate code for
   */
  entities: any[];

  /**
   * Generation options
   */
  options: {
    outputPath: string;
    overwrite?: boolean;
    format?: boolean;
    createDirectories?: boolean;
  };

  /**
   * Additional variables for template rendering
   */
  variables?: Record<string, any>;
}

/**
 * Interface for template generator
 */
export interface TemplateGenerator {
  /**
   * Generate code templates
   */
  generate(context: TemplateContext): Promise<CodeTemplate[]> | CodeTemplate[];

  /**
   * Get template metadata
   */
  getMetadata(): {
    name: string;
    description: string;
    version: string;
    supportedFrameworks?: string[];
    supportedLanguages?: string[];
  };

  /**
   * Validate template context
   */
  validate(context: TemplateContext): boolean | string[];
}
