import { useState, useEffect } from 'react'
import { X, Moon, Sun, Monitor, Globe, Save } from 'lucide-react'
import { usePreferencesStore, Language, Theme } from '@/store/preferencesStore'
import toast from 'react-hot-toast'

interface PreferencesModalProps {
  onClose: () => void
}

export default function PreferencesModal({ onClose }: PreferencesModalProps) {
  const { language, theme, setLanguage, setTheme } = usePreferencesStore()
  const [localLanguage, setLocalLanguage] = useState<Language>(language)
  const [localTheme, setLocalTheme] = useState<Theme>(theme)

  // Synchroniser les valeurs locales avec le store quand il change
  useEffect(() => {
    setLocalLanguage(language)
    setLocalTheme(theme)
  }, [language, theme])

  const handleSave = () => {
    // Sauvegarder dans le store (qui appliquera le thème automatiquement)
    setLanguage(localLanguage)
    setTheme(localTheme)
    
    toast.success('Préférences enregistrées', {
      duration: 2000,
    })
    
    // Fermer la modale après un court délai
    setTimeout(() => {
      onClose()
    }, 100)
  }

  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'fr', label: 'Français', flag: '🇫🇷' },
    { value: 'en', label: 'English', flag: '🇬🇧' },
  ]

  const themes: { value: Theme; label: string; icon: typeof Moon }[] = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full transition-colors">
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Préférences</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Langue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Langue</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {languages.map((lang) => (
                <button
                  key={lang.value}
                  onClick={() => setLocalLanguage(lang.value)}
                  className={`p-4 border-2 rounded-lg transition-all flex items-center space-x-3 ${
                    localLanguage === lang.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{lang.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
              <p className="text-xs text-amber-800 dark:text-amber-300">
                ℹ️ L'internationalisation complète sera disponible prochainement. La langue est enregistrée et sera appliquée lors de la prochaine mise à jour.
              </p>
            </div>
          </div>

          {/* Thème */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <span>Thème</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon
                return (
                  <button
                    key={themeOption.value}
                    onClick={() => setLocalTheme(themeOption.value)}
                    className={`p-4 border-2 rounded-lg transition-all flex flex-col items-center space-y-2 ${
                      localTheme === themeOption.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 dark:border-primary-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${
                      localTheme === themeOption.value 
                        ? 'text-primary-600 dark:text-primary-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <span className="text-xs font-medium text-gray-900 dark:text-white">{themeOption.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Note sur le thème système */}
          {localTheme === 'system' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                Le thème suivra automatiquement les préférences de votre système d'exploitation.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
