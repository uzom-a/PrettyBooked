import { Link } from 'react-router-dom'

const CATEGORIES = [
  { name: 'Braider', slug: 'braider', desc: 'Knotless, box braids, twists & more' },
  { name: 'Nail Tech', slug: 'nail-tech', desc: 'Acrylics, gel, nail art & more' },
  { name: 'Lash Tech', slug: 'lash-tech', desc: 'Classic, hybrid & volume sets' },
  { name: 'Seamstress', slug: 'seamstress', desc: 'Alterations, custom fits & more' },
]

export default function Landing() {
  return (
    <div>
      <section className="bg-gradient-to-br from-blush-50 via-white to-mauve-100 py-24 px-6 text-center">
        <p className="text-blush-500 font-medium tracking-widest uppercase text-sm mb-4">
          For the ladies of Grambling State
        </p>
        <h1 className="font-heading text-5xl md:text-6xl font-bold text-blush-700 mb-5 leading-tight">
          Look good. <br />
          <span className="text-mauve-500">Feel beautiful.</span>
        </h1>
        <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
          Book braiders, nail techs, lash techs and seamstresses at Grambling State.
        </p>
        <Link
          to="/browse/braider"
          className="bg-black text-white px-10 py-3.5 rounded-full font-semibold text-lg hover:bg-gray-800 transition-colors shadow-md"
        >
          Book now
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-heading text-3xl font-bold text-center text-blush-700 mb-12">
          Browse by category
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              to={`/browse/${cat.slug}`}
              className="bg-white rounded-3xl shadow-sm border border-blush-100 p-6 flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-1 transition-all text-center group"
            >
              <span className="font-heading font-semibold text-gray-800 group-hover:text-blush-600 transition-colors">
                {cat.name}
              </span>
              <span className="text-xs text-gray-400">{cat.desc}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-blush-50 border-t border-blush-100 py-10 text-center">
        <p className="font-heading text-xl text-blush-600 font-semibold">PrettyBooked</p>
        <p className="text-sm text-gray-400 mt-1">Made for GSU ladies, by GSU ladies</p>
      </section>
    </div>
  )
}
