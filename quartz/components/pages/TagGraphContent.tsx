import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "../types"
import { FullSlug, getAllSegmentPrefixes, resolveRelative } from "../../util/path"
import { QuartzPluginData } from "../../plugins/vfile"
import { i18n } from "../../i18n"

interface TagGraphContentOptions {
  /** Tags to exclude from the graph */
  excludeTags?: string[]
}

export default ((opts?: Partial<TagGraphContentOptions>) => {
  const TagGraphContent: QuartzComponent = ({
    fileData,
    allFiles,
    cfg,
  }: QuartzComponentProps) => {
    const slug = fileData.slug
    const excludeTags = opts?.excludeTags ?? []

    // Build tag -> articles mapping
    const tagToArticles: Map<string, QuartzPluginData[]> = new Map()
    for (const file of allFiles) {
      const tags = (file.frontmatter?.tags ?? [])
        .filter((tag: string) => !excludeTags.includes(tag))
        .flatMap(getAllSegmentPrefixes)
      for (const tag of tags) {
        if (!tagToArticles.has(tag)) {
          tagToArticles.set(tag, [])
        }
        tagToArticles.get(tag)!.push(file)
      }
    }

    const tags = [...tagToArticles.keys()].sort((a, b) => a.localeCompare(b))

    return (
      <div class="popover-hint tag-graph-page">
        <h2>{i18n(cfg.locale).pages.tagGraph.title}</h2>
        <p class="tag-count">
          {i18n(cfg.locale).pages.tagGraph.totalTags({ count: tags.length })}
        </p>
        <div class="graph-outer tag-graph-outer">
          <div
            class="graph-container tag-graph-container"
            data-cfg={JSON.stringify({
              drag: true,
              zoom: true,
              depth: -1,
              scale: 0.9,
              repelForce: 0.5,
              centerForce: 0.2,
              linkDistance: 30,
              fontSize: 0.6,
              opacityScale: 1,
              showTags: true,
              removeTags: excludeTags,
              focusOnHover: true,
              enableRadial: true,
            })}
          ></div>
        </div>

        <div class="tag-list-section">
          <h3>{i18n(cfg.locale).pages.tagGraph.allTags}</h3>
          <div class="tag-cloud">
            {tags.map((tag) => {
              const articles = tagToArticles.get(tag)!
              const tagSlug = `tags/${tag}` as FullSlug
              const href = resolveRelative(slug!, tagSlug)
              return (
                <a class="internal tag-link" href={href}>
                  <span class="tag-name">{tag}</span>
                  <span class="tag-count-badge">{articles.length}</span>
                </a>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  TagGraphContent.css = `
    .tag-graph-page {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .tag-graph-page .tag-count {
      color: var(--gray);
      font-size: 0.9rem;
      margin-top: -0.5rem;
    }
    .tag-graph-outer {
      border: 1px solid var(--lightgray);
      border-radius: 8px;
      padding: 0.5rem;
      background: var(--light);
    }
    .tag-graph-container {
      width: 100%;
      height: 400px;
      position: relative;
    }
    .tag-list-section {
      margin-top: 1.5rem;
    }
    .tag-list-section h3 {
      margin-bottom: 0.75rem;
    }
    .tag-cloud {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .tag-link {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.6rem;
      border-radius: 1rem;
      background: var(--lightgray);
      color: var(--dark);
      text-decoration: none;
      font-size: 0.85rem;
      transition: background 0.2s;
    }
    .tag-link:hover {
      background: var(--tertiary);
      color: white;
    }
    .tag-count-badge {
      background: var(--gray);
      color: white;
      border-radius: 50%;
      width: 1.3em;
      height: 1.3em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75em;
    }
    .tag-link:hover .tag-count-badge {
      background: rgba(255, 255, 255, 0.3);
    }
  `

  return TagGraphContent
}) satisfies QuartzComponentConstructor
