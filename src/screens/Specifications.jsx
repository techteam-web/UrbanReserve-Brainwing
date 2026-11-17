import { useRef } from 'react'
import { useIntro } from '../hooks/useIntro'
import { useDeck } from '../hooks/useDeck'
import { DeckPager } from '../components/Deck'
import { SPEC_PAGES } from '../data/content'
import Botanical from '../art/Botanical'
import Terrain from '../art/Terrain'

const two = (n) => String(n).padStart(2, '0')

// A group of the brochure's specifications: its name, and its points as ruled rows, in two columns
// where there are many and the page is wide enough
function Group({ group, lead }) {
  const many = group.items.length > 4
  return (
    <div data-in className={lead ? '' : 'mt-[4vh]'}>
      <h2 className={`display font-normal text-forest-800 ${lead ? 'text-[clamp(2rem,6vh,4.4rem)] leading-[1.02]' : 'text-[clamp(1.5rem,4.2vh,3rem)]'}`}>{group.title}</h2>
      <ul className={`mt-[3vh] gap-x-[3vw] ${many ? 'xl:columns-2' : ''}`}>
        {group.items.map((item) => (
          <li key={item} className="flex break-inside-avoid items-baseline gap-4 border-t border-forest-900/12 py-[1.35vh] text-[clamp(0.92rem,2vh,1.15rem)] text-ink/85">
            <span aria-hidden="true" className="size-1.5 shrink-0 translate-y-[-0.15em] rounded-full bg-ember" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// One page: its picture on the left (along the top on a portrait screen), its specifications beside it
function Page({ page, n, count }) {
  return (
    <div className="absolute inset-0 grid grid-rows-[38vh_minmax(0,1fr)] bg-paper text-forest-900 landscape:grid-cols-[minmax(0,45fr)_minmax(0,55fr)] landscape:grid-rows-1">
      <div data-fade className="relative overflow-hidden bg-forest-900">
        <img src={page.image} alt="" className={`absolute inset-0 h-full w-full object-cover ${page.fit}`} />
        <div className="absolute inset-0 bg-linear-to-b from-forest-950/35 via-transparent to-forest-950/25" />
        <Terrain side="left" seed={91 + n} amp={60} className="absolute inset-y-0 right-0 hidden h-full w-[2.6vw] text-paper landscape:block" />
      </div>

      {/* paper, a pixel over the picture's edge: the column boundary falls between pixels, and the
          picture's dark ground showed through there as a thin line beside the torn edge */}
      <div className="relative min-h-0 overflow-hidden bg-paper landscape:-ml-px">
        <Botanical kind="fern" seed={17 + n} depth={14} className="bottom-[6vh] right-0 w-[14vw] -scale-x-100 text-forest-700/10" />
        <div className="safe pane relative flex h-full flex-col justify-center-safe landscape:pl-[4vw]">
          <p data-in className="label tabular-nums text-[max(0.6rem,9px)] tracking-[0.22em] text-ember-deep">
            {two(n + 1)} <span className="text-ink/40">/ {two(count)}</span>
          </p>
          <div className="mt-[2vh]">
            {page.groups.map((g, i) => (
              <Group key={g.title} group={g} lead={i === 0} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Specifications as four pages, the brochure's own groups: At a Glance; Safe & Secure Environs;
 * Eco-Friendly Systems; Automated Homes with Exquisite Amenities. Paged as the Overview's slides are.
 */
export default function Specifications() {
  const root = useRef(null)
  useIntro(root)
  const { idx, nav } = useDeck(root, SPEC_PAGES.length)

  return (
    // the pages keep their words clear of the controls as well as the dock
    <section ref={root} className="screen bg-paper [--chrome-bot:calc(var(--dock-band)+3.5rem)]">
      {SPEC_PAGES.map((page, i) => (
        <div key={page.id} data-slide data-defer={i ? '' : undefined} className="absolute inset-0 overflow-hidden">
          <Page page={page} n={i} count={SPEC_PAGES.length} />
        </div>
      ))}
      <DeckPager labels={SPEC_PAGES.map((p) => p.label)} idx={idx} nav={nav} label="Specification pages" />
    </section>
  )
}
