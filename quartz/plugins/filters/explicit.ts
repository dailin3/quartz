import { QuartzFilterPlugin } from "../types"

export const ExplicitPublish: QuartzFilterPlugin = () => ({
  name: "ExplicitPublish",
  shouldPublish(_ctx, [_tree, vfile]) {
    const published = vfile.data?.frontmatter?.published
    return published !== undefined && published !== null && published !== ""
  },
})
