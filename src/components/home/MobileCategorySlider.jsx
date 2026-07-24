import Image from 'next/image';
import Link from 'next/link';

const collections = [
  { name: 'BESTSELLERS', url: '/collections/bestsellers', img: 'https://luciraonline.myshopify.com/cdn/shop/files/Best_Seller_jpg_719fedc1-d9a7-44f1-9605-3bbdece90a40_120x120_crop_center.jpg', priority: true },
  { name: 'Rings', url: '/collections/rings', img: 'https://luciraonline.myshopify.com/cdn/shop/files/Ring_jpg_e12c9c88-3cf4-46b4-bd74-e1bc2dc6bee2_120x120_crop_center.jpg', priority: true },
  { name: 'Earings', url: '/collections/earrings', img: 'https://luciraonline.myshopify.com/cdn/shop/files/Earring_jpg_4c2fc527-d8d4-430b-aa55-7af74e1de77b_120x120_crop_center.jpg', priority: true },
  { name: 'Bracelets', url: '/collections/bracelets', img: 'https://luciraonline.myshopify.com/cdn/shop/files/Bracelet_jpg_120x120_crop_center.jpg' },
  { name: 'Necklace', url: '/collections/necklaces', img: 'https://luciraonline.myshopify.com/cdn/shop/files/Pendant_jpg_5f30e325-3874-4403-b865-9206d541e1d5_120x120_crop_center.jpg' },
  { name: 'Hexa', url: '/collections/hexa', img: 'https://luciraonline.myshopify.com/cdn/shop/files/Hexa_jpg_120x120_crop_center.jpg' },
  { name: 'On the Move', url: '/collections/sports-collection', img: 'https://luciraonline.myshopify.com/cdn/shop/files/Bezel_Green_BG_V4_120x120_crop_center.jpg' },
  { name: 'Lucira Express', url: '/collections/fast-shipping', img: 'https://luciraonline.myshopify.com/cdn/shop/files/Fast_Shipping_jpg_120x120_crop_center.jpg' },
  { name: '9KT Collection', url: '/collections/9kt-collection', img: 'https://luciraonline.myshopify.com/cdn/shop/files/9KT_jpg_120x120_crop_center.jpg' },
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
              <Link prefetch={false}
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
                    unoptimized={true}
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
