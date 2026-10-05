import markSvg from '../brand/mark.svg?raw'
import lockupSvg from '../brand/lockup.svg?raw'

export function Mark({ className = '' }) {
  return <span data-brand className={`block ${className}`} dangerouslySetInnerHTML={{ __html: markSvg }} />
}

export function Lockup({ className = '' }) {
  return <span data-brand className={`block ${className}`} dangerouslySetInnerHTML={{ __html: lockupSvg }} />
}
