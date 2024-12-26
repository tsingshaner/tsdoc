// biome-ignore lint/correctness/noUndeclaredDependencies: <explanation>
import { LitElement } from 'lit'
// biome-ignore lint/correctness/noUndeclaredDependencies: <explanation>
import { customElement, property } from 'lit/decorators.js'

/**
 * Icon web components.
 *
 * @remarks
 * This component allows you to use icons from various icon libraries.
 * You can search for icons at {@link https://iconify.design/| Iconify}.
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
   */
  @property({ type: String })
  public name = ''
}

export { DocIcon }
