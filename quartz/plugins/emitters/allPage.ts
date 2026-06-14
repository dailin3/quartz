import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import { pageResources, renderPage } from "../../components/renderPage"
import { QuartzPluginData, defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { FullSlug, pathToRoot } from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { FolderContent } from "../../components"
import { write } from "./helpers"

interface AllPageOptions extends FullPageLayout {
  sort?: (f1: QuartzPluginData, f2: QuartzPluginData) => number
}

const defaultSort = (f1: QuartzPluginData, f2: QuartzPluginData): number => {
  const d1 = f1.dates?.modified ?? f1.dates?.created ?? new Date(0)
  const d2 = f2.dates?.modified ?? f2.dates?.created ?? new Date(0)
  return d2.getTime() - d1.getTime()
}

export const AllPage: QuartzEmitterPlugin<Partial<AllPageOptions>> = (userOpts) => {
  const sortFn = userOpts?.sort ?? defaultSort
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: FolderContent({ sort: sortFn }),
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
      const sorted = [...allFiles].sort(sortFn)

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
        allFiles: sorted,
      }

      const html = renderPage(cfg, slug, componentData, opts, componentData.externalResources)

      yield write({ ctx, content: html, slug, ext: ".html" })
    },
  }
}
