import { MDXProvider } from "@mdx-js/react";
import { Link } from "react-router";
import { useEffect, useRef, useState, type ComponentType } from "react";
import styles from "./mdx.module.css";

type Frontmatter = {
  title?: string;
  description?: string;
  favicon?: string;
  themeColor?: string;
};

type MdxModule = {
  default: ComponentType<any>;
  frontmatter?: Frontmatter;
};

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

function joinClassNames(...classNames: Array<string | undefined>) {
  const r = classNames.filter(Boolean).join(" ");
  console.log("joinClassNames", classNames, "=>", r);
  return r
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const LEGAL_LINKS = [
  { path: "/legal/tos", label: "Terms of Service" },
  { path: "/legal/privacy", label: "Privacy Policy" },
  { path: "/legal/cookies", label: "Cookie Policy" },
];

function LegalNav({ current }: { current: string }) {
  return (
    <nav className={styles.mdxlegalNav}>
      {LEGAL_LINKS.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={joinClassNames(
            styles.mdxlegalNavLink,
            current === link.path ? styles.mdxlegalNavLinkActive : undefined,
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default function MdxPage({
  content,
  legalNav,
}: {
  content: any;
  legalNav?: string;
}) {
  const hasModuleShape = Boolean(
    content && typeof content === "object" && "default" in content,
  );
  const Content = hasModuleShape ? (content as MdxModule).default : content;
  const frontmatter =
    (hasModuleShape ? (content as MdxModule).frontmatter : undefined) || {};
  const articleRef = useRef<HTMLElement | null>(null);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  useEffect(() => {
    const previousJustify = document.body.style.justifyContent;
    const previousAlign = document.body.style.alignItems;

    document.body.style.justifyContent = "flex-start";
    document.body.style.alignItems = "stretch";

    return () => {
      document.body.style.justifyContent = previousJustify;
      document.body.style.alignItems = previousAlign;
    };
  }, []);

  useEffect(() => {
    const previousTitle = document.title;
    const previousFavicon =
      document.querySelector('link[rel="icon"]')?.getAttribute("href") || null;
    const previousDescription =
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute("content") || null;
    const previousTheme =
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content") || null;

    const nextTitle = frontmatter.title?.trim();
    if (nextTitle) {
      document.title = nextTitle;
    }

    const nextFavicon = frontmatter.favicon?.trim();
    if (nextFavicon) {
      let faviconEl = document.querySelector(
        'link[rel="icon"]',
      ) as HTMLLinkElement | null;
      if (!faviconEl) {
        faviconEl = document.createElement("link");
        faviconEl.rel = "icon";
        document.head.appendChild(faviconEl);
      }
      faviconEl.href = nextFavicon;
    }

    const nextDescription = frontmatter.description?.trim();
    if (nextDescription) {
      let descriptionEl = document.querySelector(
        'meta[name="description"]',
      ) as HTMLMetaElement | null;
      if (!descriptionEl) {
        descriptionEl = document.createElement("meta");
        descriptionEl.name = "description";
        document.head.appendChild(descriptionEl);
      }
      descriptionEl.content = nextDescription;
    }

    const nextThemeColor = frontmatter.themeColor?.trim();
    if (nextThemeColor) {
      let themeColorEl = document.querySelector(
        'meta[name="theme-color"]',
      ) as HTMLMetaElement | null;
      if (!themeColorEl) {
        themeColorEl = document.createElement("meta");
        themeColorEl.name = "theme-color";
        document.head.appendChild(themeColorEl);
      }
      themeColorEl.content = nextThemeColor;
    }

    return () => {
      document.title = previousTitle;

      const faviconEl = document.querySelector(
        'link[rel="icon"]',
      ) as HTMLLinkElement | null;
      if (faviconEl) {
        if (previousFavicon) {
          faviconEl.href = previousFavicon;
        } else {
          faviconEl.removeAttribute("href");
        }
      }

      const descriptionEl = document.querySelector(
        'meta[name="description"]',
      ) as HTMLMetaElement | null;
      if (descriptionEl) {
        if (previousDescription !== null) {
          descriptionEl.content = previousDescription;
        } else {
          descriptionEl.remove();
        }
      }

      const themeColorEl = document.querySelector(
        'meta[name="theme-color"]',
      ) as HTMLMetaElement | null;
      if (themeColorEl) {
        if (previousTheme !== null) {
          themeColorEl.content = previousTheme;
        } else {
          themeColorEl.remove();
        }
      }
    };
  }, [
    frontmatter.description,
    frontmatter.favicon,
    frontmatter.themeColor,
    frontmatter.title,
  ]);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) {
      setTocItems([]);
      return;
    }

    const usedIds = new Set<string>();
    const headings = Array.from(
      article.querySelectorAll("h2, h3"),
    ) as HTMLHeadingElement[];

    const nextTocItems = headings
      .map((heading) => {
        const text = heading.textContent?.trim() || "";
        if (!text) {
          return null;
        }

        const level = heading.tagName === "H2" ? 2 : 3;
        const baseId = heading.id || slugify(text) || "section";

        let uniqueId = baseId;
        let i = 2;
        while (usedIds.has(uniqueId)) {
          uniqueId = `${baseId}-${i}`;
          i += 1;
        }

        usedIds.add(uniqueId);
        heading.id = uniqueId;

        return {
          id: uniqueId,
          text,
          level,
        } as TocItem;
      })
      .filter(Boolean) as TocItem[];

    setTocItems(nextTocItems);
  }, [Content]);

  const components = {
    h1: ({ className, ...props}) => <h1 className={joinClassNames(styles.mdxh1, styles.mdxheadingTarget, className)} {...props} />,
    h2: ({ className, ...props}) => <h2 className={joinClassNames(styles.mdxh2, styles.mdxheadingTarget, className)} {...props} />,
    h3: ({ className, ...props}) => <h3 className={joinClassNames(styles.mdxh3, styles.mdxheadingTarget, className)} {...props} />,
    p: ({ className, ...props}) => <p className={joinClassNames(styles.mdxp, className)} {...props} />,
    ul: ({ className, ...props}) => <ul className={joinClassNames(styles.mdxul, className)} {...props} />,
    ol: ({ className, ...props}) => <ol className={joinClassNames(styles.mdxol, className)} {...props} />,
    li: ({ className, ...props}) => <li className={joinClassNames(styles.mdxli, className)} {...props} />,
    a: ({ className, ...props}) => <a className={joinClassNames(styles.mdxa, className)} {...props} />,
    blockquote: ({ className, ...props}) => <blockquote className={joinClassNames(styles.mdxblockquote, className)} {...props} />,
    hr: ({ className, ...props}) => <hr className={joinClassNames(styles.mdxhr, className)} {...props} />,
    code: ({ className, ...props}) => <code className={joinClassNames(styles.mdxcode, className)} {...props} />,
    pre: ({ className, ...props}) => <pre className={joinClassNames(styles.mdxpre, className)} {...props} />,
    strong: ({ className, ...props}) => <strong className={joinClassNames(styles.mdxstrong, className)} {...props} />,
    table: ({ className, ...props}) => (
      <div className={styles.mdxtableWrapper}>
        <table className={joinClassNames(styles.mdxtable, className)} {...props} />
      </div>
    ),
    thead: ({ className, ...props}) => <thead className={joinClassNames(styles.mdxthead, className)} {...props} />,
    tbody: ({ className, ...props}) => <tbody className={joinClassNames(styles.mdxtbody, className)} {...props} />,
    tr: ({ className, ...props}) => <tr className={joinClassNames(styles.mdxtr, className)} {...props} />,
    th: ({ className, ...props}) => <th className={joinClassNames(styles.mdxth, className)} {...props} />,
    td: ({ className, ...props}) => <td className={joinClassNames(styles.mdxtd, className)} {...props} />,
  }

  return (
    <div className={styles.mdxpage}>
      <div className={styles.mdxcontainer}>
        <div className={styles.mdxheaderRow}>
          <span className={styles.mdxproductLabel}>In2siders docs</span>
          <Link to="/" className={styles.mdxbackLink}>
            Back home
          </Link>
        </div>

        <div className={styles.mdxlayout}>
          <aside className={styles.mdxsidebar}>
            <div className={styles.mdxsidebarIsland}>
              <p className={styles.mdxsidebarTitle}>On this page</p>
              {tocItems.length === 0 ? (
                <p className={styles.mdxemptyToc}>No sections yet.</p>
              ) : (
                <nav aria-label="Table of contents">
                  <ul className={styles.mdxtocList}>
                    {tocItems.map((item) => (
                      <li
                        key={item.id}
                        className={
                          item.level === 3
                            ? styles.mdxtocItemLevel3
                            : styles.mdxtocItemLevel2
                        }
                      >
                        <a href={`#${item.id}`} className={styles.mdxtocLink}>
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </aside>

          <main className={styles.mdxmain}>
            {legalNav && <LegalNav current={legalNav} />}
            <article className={styles.mdxarticle} ref={articleRef}>
              <Content components={components} />
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}
