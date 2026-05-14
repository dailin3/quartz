import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/tagExplorer.scss"

// @ts-ignore
import script from "./scripts/tagExplorer.inline"
import { classNames } from "../util/lang"

export interface Options {
  title?: string
  folderDefaultState: "collapsed" | "open"
  useSavedState: boolean
}

const defaultOptions: Options = {
  folderDefaultState: "collapsed",
  useSavedState: true,
}

let numTagExplorers = 0
export default ((userOpts?: Partial<Options>) => {
  const opts: Options = { ...defaultOptions, ...userOpts }

  const TagExplorer: QuartzComponent = ({ cfg, displayClass }: QuartzComponentProps) => {
    const id = `tag-explorer-${numTagExplorers++}`

    return (
      <div class={classNames(displayClass, "tag-explorer")} data-collapsed={opts.folderDefaultState}>
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
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
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
          <ul class="tag-ul overflow"></ul>
        </div>
        <template id="template-tag-article">
          <li>
            <a href="#"></a>
          </li>
        </template>
        <template id="template-tag-folder">
          <li>
            <div class="tag-folder-container">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="5 8 14 8"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="tag-folder-icon"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <div>
                <a class="tag-folder-title"></a>
              </div>
            </div>
            <div class="tag-folder-outer">
              <ul class="tag-folder-content"></ul>
            </div>
          </li>
        </template>
      </div>
    )
  }

  TagExplorer.css = style
  TagExplorer.afterDOMLoaded = script
  return TagExplorer
}) satisfies QuartzComponentConstructor
