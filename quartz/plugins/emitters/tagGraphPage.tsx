import { QuartzEmitterPlugin } from "../types"
import { QuartzComponentProps } from "../../components/types"
import HeaderConstructor from "../../components/Header"
import BodyConstructor from "../../components/Body"
import { pageResources, renderPage } from "../../components/renderPage"
import { defaultProcessedContent } from "../vfile"
import { FullPageLayout } from "../../cfg"
import { FullSlug, joinSegments, pathToRoot } from "../../util/path"
import { defaultListPageLayout, sharedPageComponents } from "../../../quartz.layout"
import { TagGraphContent } from "../../components"
import { write } from "./helpers"
import { i18n } from "../../i18n"

interface TagGraphPageOptions extends FullPageLayout {
  /** Tags to exclude from the graph */
  excludeTags?: string[]
}

export const TagGraphPage: QuartzEmitterPlugin<Partial<TagGraphPageOptions>> = (userOpts) => {
  const opts: FullPageLayout = {
    ...sharedPageComponents,
    ...defaultListPageLayout,
    pageBody: TagGraphContent({ excludeTags: userOpts?.excludeTags }),
    ...userOpts,
  }

  const { head: Head, header, beforeBody, pageBody, afterBody, left, right, footer: Footer } = opts
  const Header = HeaderConstructor()
  const Body = BodyConstructor()

  return {
    name: "TagGraphPage",
    getQuartzComponents() {
      return [
        Head,
        Header,
        Body,
        ...header,
        ...beforeBody,
        pageBody,
        ...afterBody,
        ...left,
        ...right,
        Footer,
      ]
    },
    async *emit(ctx, _content, resources) {
      const allFiles = _content.map((c) => c[1].data)
      const cfg = ctx.cfg.configuration
      const slug = joinSegments("tag-graph") as FullSlug

      const [tree, file] = defaultProcessedContent({
        slug,
        frontmatter: {
          title: i18n(cfg.locale).pages.tagGraph.title,
          tags: [],
        },
      })

      const externalResources = pageResources(pathToRoot(slug), resources)
      const componentData: QuartzComponentProps = {
        ctx,
        fileData: file.data,
        externalResources,
        cfg,
        children: [],
        tree,
        allFiles,
      }

      const content = renderPage(cfg, slug, componentData, opts, externalResources)
      yield write({
        ctx,
        content,
        slug,
        ext: ".html",
      })
    },
  }
}
