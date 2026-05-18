import Image from 'next/image';
import Link from 'next/link';

const collections = [
  { name: 'BESTSELLERS', url: '/collections/bestsellers', img: '/images/categorymobileslider/Bestseller.jpg', priority: true },
  { name: '9KT Collection', url: '/collections/9kt-collection', img: '/images/categorymobileslider/9KT.jpg', priority: true },
  { name: 'Rings', url: '/collections/rings', img: '/images/categorymobileslider/Ring.jpg', priority: true },
  { name: 'Earings', url: '/collections/earrings', img: '/images/categorymobileslider/Earring.jpg' },
  { name: 'Bracelets', url: '/collections/bracelets', img: '/images/categorymobileslider/Bracelet.jpg' },
  { name: 'Necklace', url: '/collections/necklaces', img: '/images/categorymobileslider/Pendant.jpg' },
  { name: 'Hexa', url: '/collections/hexa', img: '/images/categorymobileslider/Hexa.jpg' },
  { name: 'On the Move', url: '/collections/sports-collection', img: '/images/categorymobileslider/OnTheMove.jpg' },
  { name: 'Lucira Express', url: '/collections/fast-shipping', img: '/images/categorymobileslider/LuciraExpress.jpg' },
];

export default function MobileCategorySlider() {
  return (
    <section className="block lg:hidden py-2 px-2.5">
      <div className="w-full overflow-hidden">
        <div 
          role="list"
          className="flex overflow-x-auto overflow-y-hidden scroll-smooth gap-3.5 items-center py-2.5 px-1 no-scrollbar touch-pan-x"
        >
          {collections.map((collection, index) => (
            <div 
              key={index} 
              role="listitem" 
              className="flex flex-col items-center text-center min-w-[100px] w-[100px] shrink-0 last:mr-3"
            >
              <Link 
                href={collection.url} 
                className="flex flex-col gap-2 no-underline active:opacity-70 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-800"
                aria-label={`Shop ${collection.name}`}
              >
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 aspect-square">
                  <Image
                    src={collection.img}
                    alt={collection.name}
                    fill
                    sizes="100px"
                    priority={collection.priority}
                    className="object-cover block"
                  />
                </div>
                <p className="text-[10px] sm:text-xs uppercase text-black mt-2 font-semibold text-xs leading-[1.4] tracking-normal align-middle">
                  {collection.name}
                </p>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style> */}
    </section>
  );
};
