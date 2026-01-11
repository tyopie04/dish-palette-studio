import { useMemo } from 'react';
import { Style } from './useStyles';

/**
 * Types of global-impact changes that affect all client applications
 */
export type GlobalChangeType = 
  | 'create_global_style'
  | 'edit_global_style'
  | 'delete_global_style'
  | 'change_default_style'
  | 'edit_master_prompt'
  | 'edit_default_settings';

export interface GlobalChangeInfo {
  isGlobalChange: boolean;
  changeType: GlobalChangeType | null;
  affectedScope: 'all_clients' | 'single_org' | null;
  warningMessage: string | null;
  severity: 'warning' | 'critical' | null;
}

/**
 * Determines if a style operation is a global-impact change
 */
export function detectStyleChangeImpact(
  style: Partial<Style> | null,
  operation: 'create' | 'update' | 'delete',
  originalStyle?: Style | null
): GlobalChangeInfo {
  // For new styles
  if (operation === 'create') {
    const isGlobal = !style?.organization_id || style.organization_id === 'global';
    if (isGlobal) {
      return {
        isGlobalChange: true,
        changeType: 'create_global_style',
        affectedScope: 'all_clients',
        warningMessage: 'This style will be available to all client applications.',
        severity: 'warning',
      };
    }
    return createNoImpactResult();
  }

  // For deletions
  if (operation === 'delete' && originalStyle) {
    const isGlobal = !originalStyle.organization_id;
    if (isGlobal) {
      return {
        isGlobalChange: true,
        changeType: 'delete_global_style',
        affectedScope: 'all_clients',
        warningMessage: 'Deleting this global style will remove it from all client applications immediately.',
        severity: 'critical',
      };
    }
    return createNoImpactResult();
  }

  // For updates
  if (operation === 'update' && originalStyle) {
    const wasGlobal = !originalStyle.organization_id;
    const willBeGlobal = !style?.organization_id || style.organization_id === 'global';
    const isDefaultChanging = style?.is_default !== undefined && style.is_default !== originalStyle.is_default;

    // Changing default status on a global style
    if (isDefaultChanging && (wasGlobal || willBeGlobal)) {
      return {
        isGlobalChange: true,
        changeType: 'change_default_style',
        affectedScope: 'all_clients',
        warningMessage: style?.is_default 
          ? 'This style will become the default for all new generations across all clients.'
          : 'Removing default status will affect all client applications.',
        severity: 'warning',
      };
    }

    // Editing a global style's content
    if (wasGlobal) {
      const hasContentChanges = 
        (style?.name !== undefined && style.name !== originalStyle.name) ||
        (style?.prompt_modifier !== undefined && style.prompt_modifier !== originalStyle.prompt_modifier) ||
        (style?.status !== undefined && style.status !== originalStyle.status);

      if (hasContentChanges) {
        return {
          isGlobalChange: true,
          changeType: 'edit_global_style',
          affectedScope: 'all_clients',
          warningMessage: 'Changes to this global style will apply to all client applications immediately.',
          severity: 'warning',
        };
      }
    }
  }

  return createNoImpactResult();
}

/**
 * Determines if admin settings changes are global-impact
 */
export function detectSettingsChangeImpact(
  field: 'master_prompt' | 'default_resolution' | 'default_ratio',
  newValue: string,
  originalValue: string
): GlobalChangeInfo {
  if (newValue === originalValue) {
    return createNoImpactResult();
  }

  if (field === 'master_prompt') {
    return {
      isGlobalChange: true,
      changeType: 'edit_master_prompt',
      affectedScope: 'all_clients',
      warningMessage: 'Changing the master prompt will affect all future image generations across all clients.',
      severity: 'critical',
    };
  }

  return {
    isGlobalChange: true,
    changeType: 'edit_default_settings',
    affectedScope: 'all_clients',
    warningMessage: 'Changing default settings will apply to all new client sessions.',
    severity: 'warning',
  };
}

function createNoImpactResult(): GlobalChangeInfo {
  return {
    isGlobalChange: false,
    changeType: null,
    affectedScope: null,
    warningMessage: null,
    severity: null,
  };
}

/**
 * Hook to detect if a style form represents a global change
 */
export function useStyleGlobalChangeDetection(
  formData: {
    organizationId: string;
    isDefault: boolean;
    name: string;
    promptModifier: string;
    status: 'active' | 'inactive';
  },
  originalStyle: Style | null,
  isEditing: boolean
): GlobalChangeInfo {
  return useMemo(() => {
    const styleData: Partial<Style> = {
      organization_id: formData.organizationId === 'global' ? null : formData.organizationId,
      is_default: formData.isDefault,
      name: formData.name,
      prompt_modifier: formData.promptModifier,
      status: formData.status,
    };

    return detectStyleChangeImpact(
      styleData,
      isEditing ? 'update' : 'create',
      originalStyle
    );
  }, [formData, originalStyle, isEditing]);
}

/**
 * Hook to detect if admin settings changes are global
 */
export function useSettingsGlobalChangeDetection(
  currentValues: {
    masterPrompt: string;
    defaultResolution: string;
    defaultRatio: string;
  },
  originalValues: {
    masterPrompt: string;
    defaultResolution: string;
    defaultRatio: string;
  } | null
): GlobalChangeInfo[] {
  return useMemo(() => {
    if (!originalValues) return [];

    const changes: GlobalChangeInfo[] = [];

    if (currentValues.masterPrompt !== originalValues.masterPrompt) {
      changes.push(detectSettingsChangeImpact('master_prompt', currentValues.masterPrompt, originalValues.masterPrompt));
    }
    if (currentValues.defaultResolution !== originalValues.defaultResolution) {
      changes.push(detectSettingsChangeImpact('default_resolution', currentValues.defaultResolution, originalValues.defaultResolution));
    }
    if (currentValues.defaultRatio !== originalValues.defaultRatio) {
      changes.push(detectSettingsChangeImpact('default_ratio', currentValues.defaultRatio, originalValues.defaultRatio));
    }

    return changes.filter(c => c.isGlobalChange);
  }, [currentValues, originalValues]);
}
