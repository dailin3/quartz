import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/footer.scss"

interface Options {
  links: Record<string, string>
}

export default ((opts?: Options) => {
  const Footer: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
    const links = opts?.links ?? []
    return (
      <footer class={`${displayClass ?? ""}`}>
        <p>This site is built with <a href="https://github.com/dailin3/quartz">Quartz</a>. Contact me at: dailin_tech@qq.com. For discussion, follow the channels below:</p>
        <div>
          {Object.entries(links).map(([text, link]) => (
            <span key={text} style="margin-right: 16px">
              <a href={link}>{text}</a>
            </span>
          ))}
        </div>
      </footer>
    )
  }

  Footer.css = style
  return Footer
}) satisfies QuartzComponentConstructor
