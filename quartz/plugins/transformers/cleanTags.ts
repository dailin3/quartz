import { QuartzTransformerPlugin } from "../types"

// Tags used only for vault management — strip from blog display
const MANAGEMENT_TAGS = new Set(["#task", "#report", "#wip", "#notheme", "#private"])

export const CleanTags: QuartzTransformerPlugin = () => ({
  name: "CleanTags",
  markdownPlugins() {
    return [
      () => {
        return (_tree: any, file: any) => {
          const tags: string[] | undefined = file.data?.frontmatter?.tags
          if (tags && Array.isArray(tags)) {
            file.data.frontmatter.tags = tags.filter(
              (t: string) => !MANAGEMENT_TAGS.has(t),
            )
          }
        }
      },
    ]
  },
})
