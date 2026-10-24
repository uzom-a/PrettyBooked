export default function LegalPage({ title, updated, intro, sections }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-heading text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-sm text-gray-400 mt-2">Last updated {updated}</p>
      <p className="text-gray-600 mt-6 leading-relaxed">{intro}</p>

      {sections.map((s) => (
        <section key={s.heading} className="mt-8">
          <h2 className="font-heading text-xl font-semibold text-gray-900 mb-3">{s.heading}</h2>
          {s.paragraphs?.map((p) => (
            <p key={p} className="text-gray-600 leading-relaxed mb-3">{p}</p>
          ))}
          {s.items && (
            <ul className="list-disc pl-5 space-y-2 text-gray-600 leading-relaxed">
              {s.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  )
}
