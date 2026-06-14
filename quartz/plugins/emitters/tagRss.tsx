import { GlobalConfiguration } from "../../cfg"
import { getDate } from "../../components/Date"
import { escapeHTML } from "../../util/escape"
import { FilePath, FullSlug, SimpleSlug, joinSegments, simplifySlug } from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { toHtml } from "hast-util-to-html"
import { Root } from "hast"
import { write } from "./helpers"
import { i18n } from "../../i18n"
import { getAllSegmentPrefixes } from "../../util/path"

type ContentIndexMap = Map<FullSlug, {
  slug: FullSlug
  filePath: FilePath
  title: string
  links: SimpleSlug[]
  tags: string[]
  content: string
  richContent?: string
  date?: Date
  description?: string
}>

interface Options {
  enableRSS: boolean
  rssLimit?: number
  rssFullHtml: boolean
}

const defaultOptions: Options = {
  enableRSS: true,
  rssLimit: 10,
  rssFullHtml: false,
}

function generateRSSFeed(
  cfg: GlobalConfiguration,
  items: Array<[FullSlug, ContentIndexMap extends Map<any, infer V> ? V : any]>,
  tag: string,
  limit: number,
): string {
  const base = cfg.baseUrl ?? ""

  const createURLEntry = (slug: SimpleSlug, content: any): string => `<item>
    <title>${escapeHTML(content.title)}</title>
    <link>https://${joinSegments(base, encodeURI(slug))}</link>
    <guid>https://${joinSegments(base, encodeURI(slug))}</guid>
    <description><![CDATA[ ${content.richContent ?? content.description ?? ""} ]]></description>
    <pubDate>${content.date?.toUTCString()}</pubDate>
  </item>`

  const sorted = items
    .sort(([_, f1], [__, f2]) => {
      if (f1.date && f2.date) return f2.date.getTime() - f1.date.getTime()
      if (f1.date && !f2.date) return -1
      if (!f1.date && f2.date) return 1
      return f1.title.localeCompare(f2.title)
    })
    .slice(0, limit)
    .map(([slug, content]) => createURLEntry(simplifySlug(slug), content))
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(tag)} — ${escapeHTML(cfg.pageTitle)}</title>
      <link>https://${joinSegments(base, "tags", tag)}</link>
      <description>${i18n(cfg.locale).pages.rss.recentNotes} tagged "${escapeHTML(tag)}" on ${escapeHTML(cfg.pageTitle)}</description>
      <generator>Quartz — quartz.jzhao.xyz</generator>
      ${sorted}
    </channel>
  </rss>`
}

export const TagRss: QuartzEmitterPlugin<Partial<Options>> = (opts) => {
  opts = { ...defaultOptions, ...opts }
  return {
    name: "TagRss",
    async *emit(ctx, content) {
      if (!opts?.enableRSS) return
      const cfg = ctx.cfg.configuration

      // Build same index as ContentIndex
      const linkIndex: ContentIndexMap = new Map()
      for (const [tree, file] of content) {
        const slug = file.data.slug!
        const date = getDate(cfg, file.data) ?? new Date()
        if (file.data.text && file.data.text !== "") {
          linkIndex.set(slug, {
            slug,
            filePath: file.data.relativePath!,
            title: file.data.frontmatter?.title!,
            links: file.data.links ?? [],
            tags: file.data.frontmatter?.tags ?? [],
            content: file.data.text ?? "",
            richContent: opts?.rssFullHtml
              ? escapeHTML(toHtml(tree as Root, { allowDangerousHtml: true }))
              : undefined,
            date,
            description: file.data.description ?? "",
          })
        }
      }

      // Collect all unique tags (expanded hierarchically, like TagPage)
      const allTags = new Set<string>()
      for (const [, item] of linkIndex) {
        for (const tag of item.tags) {
          for (const prefix of getAllSegmentPrefixes(tag)) {
            allTags.add(prefix)
          }
        }
      }
      // Remove "index" base tag
      allTags.delete("index")

      // Generate per-tag RSS
      for (const tag of allTags) {
        const filtered = Array.from(linkIndex).filter(([, item]) =>
          item.tags.some((t) => getAllSegmentPrefixes(t).includes(tag)),
        )
        if (filtered.length === 0) continue

        yield write({
          ctx,
          content: generateRSSFeed(cfg, filtered, tag, opts.rssLimit ?? 10),
          slug: joinSegments("tags", tag, "index") as FullSlug,
          ext: ".xml",
        })
      }
    },
  }
}
