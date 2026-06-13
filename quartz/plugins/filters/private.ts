import { QuartzFilterPlugin } from "../types"

export const RemovePrivate: QuartzFilterPlugin = () => ({
  name: "RemovePrivate",
  shouldPublish(_ctx, [_tree, vfile]) {
    const tags: string[] | undefined = vfile.data?.frontmatter?.tags
    if (!tags || !Array.isArray(tags)) return true
    const hasPrivate = tags.some(
      (t) => typeof t === "string" && t.toLowerCase().includes("private"),
    )
    return !hasPrivate
  },
})
