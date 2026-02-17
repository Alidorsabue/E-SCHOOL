import toast from 'react-hot-toast'

/**
 * Affiche un message d'erreur formaté à partir d'une erreur API
 */
export const showErrorToast = (error: any, defaultMessage = 'Une erreur est survenue') => {
  // Si error est un objet avec une propriété message, l'utiliser directement
  if (error?.message && !error?.response) {
    toast.error(error.message, {
      duration: 5000,
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
    return
  }
  
  const errorData = error?.response?.data
  
  if (!errorData) {
    toast.error(defaultMessage, {
      duration: 5000,
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
    return
  }
  
  // Priorité 1: Erreurs non liées à un champ spécifique
  if (errorData.non_field_errors) {
    const msg = Array.isArray(errorData.non_field_errors) 
      ? errorData.non_field_errors[0] 
      : errorData.non_field_errors
    toast.error(msg, {
      duration: 6000,
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
    return
  }
  
  // Priorité 2: Message détaillé général
  if (errorData.detail) {
    toast.error(errorData.detail, {
      duration: 6000,
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
    return
  }
  
  // Priorité 3: Clé "error" (certaines APIs)
  if (errorData.error && typeof errorData.error === 'string') {
    toast.error(errorData.error, {
      duration: 6000,
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
    return
  }

  // Priorité 4: Message simple
  if (errorData.message) {
    toast.error(errorData.message, {
      duration: 6000,
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
    return
  }
  
  // Priorité 5: Erreurs de validation par champ (ex. serializer.errors Django)
  const fieldErrors: string[] = []
  Object.keys(errorData).forEach((field) => {
    const fieldError = errorData[field]
    if (Array.isArray(fieldError) && fieldError.length > 0) {
      // Traduire les noms de champs en français
      const fieldName = translateFieldName(field)
      fieldErrors.push(`${fieldName}: ${fieldError[0]}`)
    } else if (typeof fieldError === 'string') {
      const fieldName = translateFieldName(field)
      fieldErrors.push(`${fieldName}: ${fieldError}`)
    }
  })
  
  if (fieldErrors.length > 0) {
    // Afficher la première erreur, les autres dans la console
    toast.error(fieldErrors[0], {
      duration: 6000,
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
    if (fieldErrors.length > 1) {
      console.error('Autres erreurs de validation:', fieldErrors.slice(1))
    }
  } else {
    toast.error(defaultMessage, {
      duration: 5000,
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
}

/**
 * Traduit les noms de champs en français
 */
const translateFieldName = (field: string): string => {
  const translations: Record<string, string> = {
    username: 'Nom d\'utilisateur',
    email: 'Email',
    password: 'Mot de passe',
    password2: 'Confirmation du mot de passe',
    first_name: 'Prénom',
    last_name: 'Nom',
    phone: 'Téléphone',
    school: 'École',
    role: 'Rôle',
    name: 'Nom',
    code: 'Code',
    capacity: 'Capacité',
    academic_year: 'Année académique',
    requested_class: 'Classe demandée',
    employee_id: 'Matricule',
    specialization: 'Spécialisation',
    hire_date: 'Date d\'embauche',
    salary: 'Salaire',
    title: 'Titre',
    author: 'Auteur',
    isbn: 'ISBN',
    category: 'Catégorie',
    description: 'Description',
    price: 'Prix',
    currency: 'Devise',
    language: 'Langue',
    pages: 'Pages',
    subject: 'Matière',
    school_class: 'Classe',
    teacher: 'Enseignant',
    student: 'Élève',
    parent: 'Parent',
    s1_p1: '1ère P. (S1)',
    s1_p2: '2ème P. (S1)',
    s1_exam: 'Examen S1',
    s2_p3: '3ème P. (S2)',
    s2_p4: '4ème P. (S2)',
    s2_exam: 'Examen S2',
    meeting_date: 'Date de réunion',
    meeting_type: 'Type de réunion',
  }
  
  return translations[field] || field
}

/**
 * Affiche un message de succès
 */
export const showSuccessToast = (message: string) => {
  toast.success(message, {
    duration: 4000,
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

/**
 * Affiche un message d'information
 */
export const showInfoToast = (message: string) => {
  toast(message, {
    duration: 4000,
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

/**
 * Affiche un message d'avertissement
 */
export const showWarningToast = (message: string) => {
  toast(message, {
    duration: 5000,
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
