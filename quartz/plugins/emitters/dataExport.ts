import { QuartzEmitterPlugin } from "../types"
import { getDate } from "../../components/Date"
import { FullSlug, joinSegments } from "../../util/path"
import { write } from "./helpers"
import fs from "fs"
import path from "path"

export const DataExport: QuartzEmitterPlugin = () => ({
  name: "DataExport",
  async *emit(ctx, content) {
    const cfg = ctx.cfg.configuration

    // Clean stale data directory before each build
    const dataDir = path.join(ctx.argv.output, "data")
    await fs.promises.rm(dataDir, { recursive: true, force: true })

    const articles: {
      slug: string
      title: string
      tags: string[]
      date: string | null
      description: string
    }[] = []

    for (const [_, file] of content) {
      const slug = file.data.slug
      if (!slug || slug === "index") continue

      const date = getDate(cfg, file.data)

      articles.push({
        slug,
        title: file.data.frontmatter?.title ?? "",
        tags: file.data.frontmatter?.tags ?? [],
        date: date?.toISOString() ?? null,
        description: file.data.description ?? "",
      })
    }

    // Sort by date descending, then alphabetically
    articles.sort((a, b) => {
      if (a.date && b.date) return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (a.date) return -1
      if (b.date) return 1
      return a.title.localeCompare(b.title)
    })

    // Write articles.json (all metadata)
    yield write({
      ctx,
      content: JSON.stringify(articles, null, 2),
      slug: "data/articles" as FullSlug,
      ext: ".json",
    })

    // Write per-article content as markdown
    for (const [_, file] of content) {
      const slug = file.data.slug
      if (!slug || slug === "index") continue

      const text = file.data.text
      if (!text || text === "") continue

      const contentSlug = joinSegments("data/content", slug) as FullSlug
      yield write({
        ctx,
        content: text,
        slug: contentSlug,
        ext: ".md",
      })
    }
  },
})
