import { MDXProvider } from "@mdx-js/react"

export default function MdxPage({ content }) {
  const Content = content

  const components = {
    h1: (props) => <h1 className="block text-4xl font-bold my-6" {...props} />,
    h2: (props) => <h2 className="block text-3xl font-semibold mt-8 mb-4 border-b border-gray-700" {...props} />,
    h3: (props) => <h3 className="block text-2xl font-medium my-4" {...props} />,
    p: (props) => <p className="text-lg my-4 leading-relaxed text-gray-300" {...props} />,
    li: (props) => <li className="ml-6 list-disc mb-2" {...props} />,
    hr: (props) => <hr className="my-8 border-gray-700" {...props} />,
  }

  return (
    <div className="w-screen h-screen px-28 py-16 overflow-y-auto">
      <MDXProvider components={components}>
        <Content />
      </MDXProvider>
    </div>
  )
}
