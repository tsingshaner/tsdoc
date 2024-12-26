/**
 * Custom node kinds.
 *
 * @public
 */
export enum CustomNodeKind {
  /** An article node. */
  DocArticle = 'article',
  /** A source code url node. */
  DocSource = 'source',
  /** An article toc node.  */
  DocToc = 'toc'
}

export enum ReleaseTag {
  Alpha = 0,
  Beta = 1,
  Deprecated = 2,
  Stable = 3
}
