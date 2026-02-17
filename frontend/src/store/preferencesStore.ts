import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type Language = 'fr' | 'en'
export type Theme = 'light' | 'dark' | 'system'

interface PreferencesState {
  language: Language
  theme: Theme
  setLanguage: (language: Language) => void
  setTheme: (theme: Theme) => void
}

// Fonction pour appliquer le thème de manière synchrone et immédiate
const applyTheme = (theme: Theme) => {
  if (typeof document === 'undefined') return
  
  const htmlElement = document.documentElement
  
  // Vérification initiale
  const initialHasDark = htmlElement.classList.contains('dark')
  console.log(`🔍 État initial: classe 'dark' = ${initialHasDark}, thème demandé = ${theme}`)
  
  // Toujours retirer la classe dark d'abord
  htmlElement.classList.remove('dark')
  
  // Appliquer le thème immédiatement
  if (theme === 'dark') {
    htmlElement.classList.add('dark')
    console.log('✅ Thème sombre appliqué')
  } else if (theme === 'light') {
    // S'assurer que la classe est bien retirée (déjà fait, mais on le refait pour être sûr)
    htmlElement.classList.remove('dark')
    console.log('✅ Thème clair appliqué (dark retiré)')
  } else {
    // System theme
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      htmlElement.classList.add('dark')
      console.log('✅ Thème système appliqué (sombre)')
    } else {
      htmlElement.classList.remove('dark')
      console.log('✅ Thème système appliqué (clair)')
    }
  }
  
  // Forcer un reflow immédiat pour déclencher le recalcul des styles
  void htmlElement.offsetHeight
  
  // Vérification finale après un court délai pour s'assurer que le changement est pris en compte
  setTimeout(() => {
    const hasDark = htmlElement.classList.contains('dark')
    console.log(`🔍 État final: classe 'dark' = ${hasDark}, thème demandé = ${theme}`)
    
    // Si le thème est light mais que dark est toujours présent, forcer la suppression de manière agressive
    if (theme === 'light' && hasDark) {
      console.warn('⚠️ La classe dark est toujours présente malgré le thème light!')
      console.warn('⚠️ Forçage de la suppression...')
      
      // Méthode 1: Retirer la classe
      htmlElement.classList.remove('dark')
      
      // Méthode 2: Modifier directement className
      htmlElement.className = htmlElement.className.split(' ').filter(c => c !== 'dark').join(' ')
      
      // Méthode 3: Forcer un re-render via un attribut data
      htmlElement.setAttribute('data-theme-forced', 'light')
      htmlElement.removeAttribute('data-theme-forced')
      
      // Forcer plusieurs reflows
      void htmlElement.offsetHeight
      void document.body.offsetHeight
      
      // Vérification après le forçage
      const stillHasDark = htmlElement.classList.contains('dark')
      console.log(`🔍 Après forçage: classe 'dark' = ${stillHasDark}`)
      
      if (stillHasDark) {
        console.error('❌ ERREUR: Impossible de retirer la classe dark!')
        console.error('❌ Cela peut indiquer un problème avec Tailwind CSS ou un cache du navigateur.')
        console.error('❌ Essayez de vider le cache du navigateur (Ctrl+Shift+R)')
      }
    }
  }, 100)
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      language: 'fr',
      theme: 'light',
      setLanguage: (language) => {
        set({ language })
        // La langue sera utilisée pour l'internationalisation (à implémenter)
        console.log('Langue changée:', language)
      },
      setTheme: (theme) => {
        console.log(`🎨 Changement de thème demandé: ${theme}`)
        set({ theme })
        // Appliquer le thème immédiatement
        applyTheme(theme)
      },
    }),
    {
      name: 'preferences-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // Appliquer le thème après la réhydratation avec un petit délai
        // pour s'assurer que le DOM est prêt
        setTimeout(() => {
          if (state?.theme) {
            applyTheme(state.theme)
          } else {
            // Par défaut, appliquer le thème clair
            applyTheme('light')
          }
        }, 0)
      },
    }
  )
)
