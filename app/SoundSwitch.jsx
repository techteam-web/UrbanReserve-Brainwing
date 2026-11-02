import { setSound, useSoundPlaying } from './ambience'

// The switch for the background sound, at the top left of every screen, over the page fades and the
// intro film alike. Its bars rise and fall while the sound plays and lie flat while it's off.
export default function SoundSwitch() {
  const playing = useSoundPlaying()
  return (
    <button
      data-sound-switch
      onClick={() => setSound(!playing)}
      aria-pressed={playing}
      aria-label="Background sound"
      title={playing ? 'Sound off' : 'Sound on'}
      className="fixed left-(--gutter) top-[calc((var(--chrome-top)-2.5rem)/2)] z-86 grid size-10 place-items-center rounded-full border border-ivory/10 bg-forest-950/70 text-gold-lit shadow-[0_12px_30px_-12px_rgb(0_0_0/0.7)] backdrop-blur-xl transition-colors duration-300 outline-none hover:border-gold/50 focus-visible:ring-1 focus-visible:ring-gold-lit/70"
    >
      <span className={`sound-bars ${playing ? 'is-on' : ''}`} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </button>
  )
}
