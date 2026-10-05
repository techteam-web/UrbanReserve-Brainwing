import { useRef, useState } from 'react'
import { useIntro, useTone } from '../hooks/useIntro'
import { BRAND, RESIDENCES } from '../data/content'
import { Lockup } from '../art/Brand'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

const field =
  'w-full border-b border-ivory/25 bg-transparent py-[1.4vh] text-ivory placeholder:text-ivory/45 transition-colors duration-300 focus:border-gold focus:outline-none'

export default function Enquire() {
  const root = useRef(null)
  const [sent, setSent] = useState(false)
  useTone('dark')
  useIntro(root)

  const submit = (e) => {
    e.preventDefault()
    const d = Object.fromEntries(new FormData(e.currentTarget))
    const msg = `Hello, I'm interested in Urban Reserve.\nName: ${d.name}\nPhone: ${d.phone}\nEmail: ${d.email || '-'}\nConfiguration: ${d.config}`
    window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
    setSent(true)
  }

  return (
    <section ref={root} className="screen bg-forest-900 text-ivory">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,rgb(201_163_90/0.12),transparent_50%)]" />
      <div className="absolute inset-x-0 bottom-0">
        <div className="drift absolute inset-x-[-4%] bottom-0" style={{ '--d': 6 }}>
          <Terrain side="top" seed={44} amp={55} kind="hills" className="h-[20vh] w-full text-forest-800/70" />
        </div>
        <div className="drift absolute inset-x-[-4%] -bottom-1" style={{ '--d': 14 }}>
          <Terrain side="top" seed={9} amp={45} kind="hills" className="h-[11vh] w-full text-forest-950/80" />
        </div>
      </div>
      <Botanical kind="umbel" seed={22} depth={-14} className="right-0 top-[4vh] w-[13vw] text-gold/30" />
      <Botanical kind="seed" seed={5} depth={24} className="left-[46%] top-[20vh] w-[3vw] rotate-12 text-ivory/25" />

      <div className="safe relative grid h-full gap-[5vh] pane [align-content:safe_center] lg:grid-cols-2 lg:gap-[7vw]">
        <div className="flex flex-col justify-center">
          <div data-in className="w-[clamp(5rem,12vh,7.5rem)] text-gold">
            <Lockup />
          </div>
          <p data-in className="eyebrow mt-[5vh] text-gold-lit">Enquire</p>
          <h2 data-in className="display mt-[1.5vh] text-[clamp(2.2rem,6.4vh,4.8rem)] font-normal">
            Begin your
            <br />
            reserve
          </h2>
          <p data-in className="copy mt-[2.5vh] max-w-md text-ivory/75">Share your details and our team will reach out with plans, pricing and a private site visit.</p>
          <div data-in className="mt-[4vh] space-y-1.5 text-ivory/80">
            <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className="block w-fit transition-colors hover:text-gold-lit">{BRAND.phone}</a>
            <a href={`mailto:${BRAND.email}`} className="block w-fit transition-colors hover:text-gold-lit">{BRAND.email}</a>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col justify-center gap-[2.6vh] lg:max-w-lg">
          <input data-in required name="name" placeholder="Full name" autoComplete="name" className={field} />
          <input data-in required name="phone" type="tel" placeholder="Phone" autoComplete="tel" className={field} />
          <input data-in name="email" type="email" placeholder="Email (optional)" autoComplete="email" className={field} />
          <select data-in name="config" defaultValue={RESIDENCES[0].label} className={`${field} [&>option]:text-ink`}>
            {RESIDENCES.map((r) => (
              <option key={r.id}>{r.label}</option>
            ))}
          </select>
          <div data-in className="mt-[1.5vh] flex flex-wrap items-center gap-5">
            <button className="btn btn-solid">{sent ? 'Send again' : 'Send via WhatsApp'}</button>
            {sent && <p className="text-sm text-gold-lit">Thank you — WhatsApp opened in a new tab.</p>}
          </div>
        </form>
      </div>
    </section>
  )
}
