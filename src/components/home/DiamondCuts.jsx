import Image from 'next/image';
import Link from 'next/link';

// Move data outside the component to prevent re-creation on every render
const SHAPES = [
  { name: 'Emerald', slug: 'solitaires-emerald', imgId: 'Emerald_2_1' },
  { name: 'Oval', slug: 'solitaires-oval', imgId: 'Oval_1_1' },
  { name: 'Cushion', slug: 'solitaires-cushion', imgId: 'Cushion_1_1' },
  { name: 'Round', slug: 'solitaire-round', imgId: 'Round_1' },
  { name: 'Princess', slug: 'solitaires-princess', imgId: 'Princess_1' },
  { name: 'Pear', slug: 'solitaires-pear', imgId: 'Pear_1' },
  { name: 'Marquise', slug: 'solitaires-marquise', imgId: 'Marquise_1' },
  { name: 'Heart', slug: 'solitaires-heart', imgId: 'Heart_1' },
];

export default function DiamondShapes() {
  return (
    <section className="w-full bg-[#FEF5F1] py-12 md:py-14 mt-12 md:mt-15 overflow-hidden">
      <div className="container-main">
        <div className="text-left lg:text-center mb-10 px-1 lg:px-0">
          <h2 className="text-2xl lg:text-4xl font-extrabold font-abhaya mb-1 text-black">
            Explore Our Diamond Cuts
          </h2>
          <p className="text-black font-normal md:text-base text-sm leading-[1.4] tracking-normal align-middle">
            Where Geometry Elevates Style
          </p>
        </div>

        <div className="grid grid-cols-4 lg:grid-cols-8 gap-y-10 gap-x-4">
          {SHAPES.map((shape) => (
            <Link
              key={shape.slug}
              href={`/collections/${shape.slug}`}
              className="group flex flex-col items-center"
            >
              <div className="w-14 md:w-full lg:w-18 relative aspect-square max-w-24 mb-4">
                <Image
                  src={`/images/diamondCuts/${shape.imgId}.png`}
                  alt={`${shape.name} cut diamond shape`}
                  fill
                  sizes="(max-width: 768px) 80px, 100px"
                  className="object-contain transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
              </div>
              
              <span className="text-xs font-semibold text-black uppercase tracking-widest text-center">
                {shape.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}