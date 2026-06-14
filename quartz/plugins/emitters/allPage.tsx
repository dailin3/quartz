import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps, QuartzComponent } from "../../components/types"
import { pageResources, renderPage } from "../../components/renderPage"
import { QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { FullSlug, pathToRoot, resolveRelative } from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { byDateAndAlphabeticalFolderFirst } from "../../components/PageList"
import { write } from "./helpers"

interface AllPageOptions extends FullPageLayout {
  sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

const AllList: QuartzComponent = (props: QuartzComponentProps) => {
  const cfg = props.cfg
  const fileData = props.fileData
  const allFiles: QuartzPluginData[] = (props as any).allFiles ?? []
  const sorter = byDateAndAlphabeticalFolderFirst(cfg)
  const list = [...allFiles].sort(sorter)
  return (
    <ul class="section-ul">
      {list.map((page) => {
        const title = page.frontmatter?.title
        const tags = page.frontmatter?.tags ?? []
        return (
          <li class="section-li">
            <div class="section">
              <p class="meta">{page.dates?.modified?.toLocaleDateString(cfg.locale)}</p>
              <div class="desc">
                <h3>
                  <a href={resolveRelative(fileData.slug!, page.slug!)} class="internal">
                    {title}
                  </a>
                </h3>
              </div>
              <ul class="tags">
                {tags.map((tag) => (
                  <li>
                    <a class="internal tag-link" href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}>
                      {tag}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export const AllPage: QuartzEmitterPlugin<Partial<AllPageOptions>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: AllList,
    ...userOpts,
  }

  return {
    name: "AllPage",
    async *emit(ctx, content, resources) {
      const cfg = ctx.cfg.configuration
      const slug = "all/index" as FullSlug

      const allFiles: QuartzPluginData[] = []
      for (const [_, file] of content) {
        allFiles.push(file.data)
      }

      const pageContent = defaultProcessedContent({
        slug,
        frontmatter: { title: "All Articles", tags: [] },
      })

      const componentData: QuartzComponentProps = {
        ctx,
        fileData: pageContent[1].data,
        externalResources: pageResources(pathToRoot(slug), resources),
        cfg,
        children: [],
        tree: pageContent[0],
        allFiles,
      }

      const html = renderPage(cfg, slug, componentData, opts, componentData.externalResources)

      yield write({ ctx, content: html, slug, ext: ".html" })
    },
  }
}
