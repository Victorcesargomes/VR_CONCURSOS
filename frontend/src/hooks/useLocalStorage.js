import { useEffect, useState } from 'react'

// useState que persiste em localStorage (com tolerância a acesso proibido/erros).
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored !== null ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* ignora (modo privado, quota etc.) */
    }
  }, [key, value])

  return [value, setValue]
}
