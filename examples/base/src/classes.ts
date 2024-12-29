// biome-ignore lint/correctness/noUndeclaredDependencies: <explanation>
import { LitElement } from 'lit'
// biome-ignore lint/correctness/noUndeclaredDependencies: <explanation>
import { customElement, property } from 'lit/decorators.js'

/**
 * Icon web components.
 *
 * @remarks
 * This component allows you to use icons from various icon libraries.
 * You can search for icons at {@link https://iconify.design/ | Iconify}.
 *
 * The `Icon` component is a custom element that can be used in your HTML.
 * It supports various attributes to customize the icon's appearance.
 *
 * @decorator `@customElement('doc-icon')`
 *
 * @example
 * Here's an example of how to use the `Icon` component:
 * ```html
 * <doc-icon name="mdi:home" size="24" color="blue"></doc-icon>
 * ```
 *
 * @public
 */
@customElement('doc-icon')
class DocIcon extends LitElement {
  /**
   * The icon id. e.g. `mdi:home`
   *
   * @decorator `@property({ type: String })`
   *
   * @see {@link https://iconify.design/ | Iconify} for more icons.
   */
  @property({ type: String })
  public name = ''
}

/**
 * A server interface.
 *
 * @remarks
 * This interface defines the basic methods for a server.
 *
 * @public
 */
interface IServer {
  /**
   * Server start listen.
   * @param port - The port to listen on.
   */
  listen(port: number): void
  /** Init server services. */
  start(): void
}

/**
 * {@inheritdoc IServer}
 *
 * @public
 */
abstract class Server implements IServer {
  /**
   * {@inheritdoc IServer.listen}
   *
   * @virtual
   */
  listen(port: number): void {
    console.info(`Server listening on port ${port}`)
  }

  /** {@inheritdoc IServer.start} */
  abstract start(): void
}

/**
 * A web server.
 *
 * @public
 */
class WebServer extends Server implements IServer {
  /**
   * {@inheritdoc IServer.listen}
   *
   * @sealed
   * @override
   */
  override listen(port: number): void {
    console.info(`Web server listening on port ${port}`)
  }

  /**
   * {@inheritdoc IServer.listen}
   */
  start(): void {
    console.info('Web server started.')
  }
}

export type { IServer }
export { DocIcon, Server, WebServer }
