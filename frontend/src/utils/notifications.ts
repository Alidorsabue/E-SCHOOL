import toast from 'react-hot-toast'

/**
 * Utility functions for displaying notifications with consistent styling
 */

export const showSuccess = (message: string, duration: number = 4000) => {
  return toast.success(message, {
    duration,
    style: {
      borderLeft: '5px solid #10b981',
      background: 'linear-gradient(to right, #f0fdf4 0%, #ffffff 5%)',
      color: '#065f46',
      boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.04)',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '480px',
      minWidth: '340px',
      lineHeight: '1.6',
    },
    iconTheme: {
      primary: '#10b981',
      secondary: '#fff',
    },
  })
}

export const showError = (message: string, duration: number = 5000) => {
  return toast.error(message, {
    duration,
    style: {
      borderLeft: '5px solid #ef4444',
      background: 'linear-gradient(to right, #fef2f2 0%, #ffffff 5%)',
      color: '#991b1b',
      boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.1), 0 10px 10px -5px rgba(239, 68, 68, 0.04)',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '480px',
      minWidth: '340px',
      lineHeight: '1.6',
    },
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  })
}

export const showWarning = (message: string, duration: number = 5000) => {
  return toast(message, {
    duration,
    icon: '⚠️',
    style: {
      borderLeft: '5px solid #f59e0b',
      background: 'linear-gradient(to right, #fffbeb 0%, #ffffff 5%)',
      color: '#92400e',
      boxShadow: '0 20px 25px -5px rgba(245, 158, 11, 0.1), 0 10px 10px -5px rgba(245, 158, 11, 0.04)',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '480px',
      minWidth: '340px',
      lineHeight: '1.6',
    },
    iconTheme: {
      primary: '#f59e0b',
      secondary: '#fff',
    },
  })
}

export const showInfo = (message: string, duration: number = 4000) => {
  return toast(message, {
    duration,
    icon: 'ℹ️',
    style: {
      borderLeft: '5px solid #3b82f6',
      background: 'linear-gradient(to right, #eff6ff 0%, #ffffff 5%)',
      color: '#1e40af',
      boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '480px',
      minWidth: '340px',
      lineHeight: '1.6',
    },
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#fff',
    },
  })
}

export const showLoading = (message: string = 'Chargement...') => {
  return toast.loading(message, {
    style: {
      borderLeft: '5px solid #3b82f6',
      background: 'linear-gradient(to right, #eff6ff 0%, #ffffff 5%)',
      color: '#1e40af',
      boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)',
      padding: '16px 20px',
      borderRadius: '16px',
      fontSize: '14px',
      fontWeight: '500',
      maxWidth: '480px',
      minWidth: '340px',
      lineHeight: '1.6',
    },
    iconTheme: {
      primary: '#3b82f6',
      secondary: '#fff',
    },
  })
}

/**
 * Extract and format error messages from API responses
 */
export const formatErrorMessage = (error: any): string => {
  if (!error) return 'Une erreur est survenue'
  
  // Handle Axios error response
  const data = error.response?.data || error.data || error
  
  // Check for non_field_errors first
  if (data?.non_field_errors && Array.isArray(data.non_field_errors)) {
    return data.non_field_errors.join(', ')
  }
  
  // Check for detail or message
  if (data?.detail) return data.detail
  if (data?.message) return data.message
  
  // Handle field-specific errors
  if (typeof data === 'object') {
    const fieldErrors: string[] = []
    Object.keys(data).forEach((key) => {
      if (Array.isArray(data[key])) {
        const errors = data[key].map((err: any) => 
          typeof err === 'string' ? err : err.message || err
        )
        fieldErrors.push(`${key}: ${errors.join(', ')}`)
      } else if (typeof data[key] === 'string') {
        fieldErrors.push(`${key}: ${data[key]}`)
      }
    })
    if (fieldErrors.length > 0) {
      return fieldErrors.join(' | ')
    }
  }
  
  // Fallback
  if (typeof data === 'string') return data
  return 'Une erreur est survenue'
}

/**
 * Show error notification with formatted message
 */
export const showFormattedError = (error: any, defaultMessage: string = 'Erreur lors de l\'opération') => {
  const message = formatErrorMessage(error) || defaultMessage
  showError(message)
}
