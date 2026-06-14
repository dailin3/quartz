import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [],
  afterBody: [
    Component.Comments({
      provider: "giscus",
      options: {
        repo: "dailin3/quartz",
        repoId: "R_kgDOScBS6A",
        category: "Announcements",
        categoryId: "DIC_kwDOScBS6M4C_H5d",
        themeUrl: "https://giscus.app/themes",
        mapping: "pathname",
        reactionsEnabled: true,
        inputPosition: "bottom",
        lang: "zh-CN",
      },
    }),
  ],
  footer: Component.Footer({
    links: {
      Telegram: "https://t.me/+cKtfBqI0INdmMzg1",
      RSS: "https://blog.dailin.tech/index.xml",
      QQ: "https://qm.qq.com/q/QlYmkHbf6S",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.TagExplorer(),
    Component.RecentNotes({ limit: 5, linkToMore: "tags", showTags: false }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.TagExplorer(),
    Component.RecentNotes({ limit: 5, linkToMore: "tags", showTags: false }),
  ],
  right: [],
}
