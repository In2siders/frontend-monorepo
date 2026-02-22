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
  return classNames.filter(Boolean).join(" ");
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
    <nav className={styles.mxlegalNav}>
      {LEGAL_LINKS.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={joinClassNames(
            styles.mxlegalNavLink,
            current === link.path ? styles.mxlegalNavLinkActive : undefined,
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
    h1: (props) => (
      <h1 className={joinClassNames(styles.mxh1, props.className)} {...props} />
    ),
    h2: (props) => (
      <h2
        className={joinClassNames(
          styles.mxh2,
          styles.mxheadingTarget,
          props.className,
        )}
        {...props}
      />
    ),
    h3: (props) => (
      <h3
        className={joinClassNames(
          styles.mxh3,
          styles.mxheadingTarget,
          props.className,
        )}
        {...props}
      />
    ),
    p: (props) => (
      <p className={joinClassNames(styles.mxp, props.className)} {...props} />
    ),
    ul: (props) => (
      <ul className={joinClassNames(styles.mxul, props.className)} {...props} />
    ),
    ol: (props) => (
      <ol className={joinClassNames(styles.mxol, props.className)} {...props} />
    ),
    li: (props) => (
      <li className={joinClassNames(styles.mxli, props.className)} {...props} />
    ),
    a: (props) => (
      <a className={joinClassNames(styles.mxa, props.className)} {...props} />
    ),
    blockquote: (props) => (
      <blockquote
        className={joinClassNames(styles.mxblockquote, props.className)}
        {...props}
      />
    ),
    hr: (props) => (
      <hr className={joinClassNames(styles.mxhr, props.className)} {...props} />
    ),
    code: (props) => (
      <code
        className={joinClassNames(styles.mxcode, props.className)}
        {...props}
      />
    ),
    pre: (props) => (
      <pre
        className={joinClassNames(styles.mxpre, props.className)}
        {...props}
      />
    ),
    strong: (props) => (
      <strong
        className={joinClassNames(styles.mxstrong, props.className)}
        {...props}
      />
    ),
    table: (props) => (
      <div className={styles.mxtableWrapper}>
        <table
          className={joinClassNames(styles.mxtable, props.className)}
          {...props}
        />
      </div>
    ),
    thead: (props) => (
      <thead
        className={joinClassNames(styles.mxthead, props.className)}
        {...props}
      />
    ),
    tbody: (props) => (
      <tbody
        className={joinClassNames(styles.mxtbody, props.className)}
        {...props}
      />
    ),
    tr: (props) => (
      <tr className={joinClassNames(styles.mxtr, props.className)} {...props} />
    ),
    th: (props) => (
      <th className={joinClassNames(styles.mxth, props.className)} {...props} />
    ),
    td: (props) => (
      <td className={joinClassNames(styles.mxtd, props.className)} {...props} />
    ),
  };

  return (
    <div className={styles.mxpage}>
      <div className={styles.mxcontainer}>
        <div className={styles.mxheaderRow}>
          <span className={styles.mxproductLabel}>In2siders docs</span>
          <Link to="/" className={styles.mxbackLink}>
            Back home
          </Link>
        </div>

        <div className={styles.mxlayout}>
          <aside className={styles.mxsidebar}>
            <div className={styles.mxsidebarIsland}>
              <p className={styles.mxsidebarTitle}>On this page</p>
              {tocItems.length === 0 ? (
                <p className={styles.mxemptyToc}>No sections yet.</p>
              ) : (
                <nav aria-label="Table of contents">
                  <ul className={styles.mxtocList}>
                    {tocItems.map((item) => (
                      <li
                        key={item.id}
                        className={
                          item.level === 3
                            ? styles.mxtocItemLevel3
                            : styles.mxtocItemLevel2
                        }
                      >
                        <a href={`#${item.id}`} className={styles.mxtocLink}>
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
            </div>
          </aside>

          <main className={styles.mxmain}>
            {legalNav && <LegalNav current={legalNav} />}
            <article className={styles.mxarticle} ref={articleRef}>
              <MDXProvider components={components}>
                <Content />
              </MDXProvider>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
}
