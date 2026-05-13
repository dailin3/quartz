import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/tagExplorer.scss"

// @ts-ignore
import script from "./scripts/tagExplorer.inline"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"

export interface Options {
  title?: string
}

const defaultOptions: Options = {}

let numTagExplorers = 0
export default ((userOpts?: Partial<Options>) => {
  const opts: Options = { ...defaultOptions, ...userOpts }

  const TagExplorer: QuartzComponent = ({ cfg, displayClass }: QuartzComponentProps) => {
    const id = `tag-explorer-${numTagExplorers++}`

    return (
      <div class={classNames(displayClass, "tag-explorer")}>
        <button
          type="button"
          class="tag-explorer-toggle mobile-explorer hide-until-loaded"
          data-mobile={true}
          aria-controls={id}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
            <path d="M7 7h.01"/>
          </svg>
        </button>
        <button
          type="button"
          class="title-button tag-explorer-toggle desktop-explorer"
          data-mobile={false}
          aria-expanded={true}
        >
          <h2>{opts.title ?? "Tags"}</h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="5 8 14 8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="fold"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div id={id} class="tag-explorer-content" aria-expanded={false} role="group">
          <ul class="tag-ul"></ul>
        </div>
      </div>
    )
  }

  TagExplorer.css = style
  TagExplorer.afterDOMLoaded = script
  return TagExplorer
}) satisfies QuartzComponentConstructor
