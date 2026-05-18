
import Link from 'next/link';
import Image from 'next/image';

export default function MetalEducationPage() {
  // Full data for the comparison table to keep the JSX clean
  const comparisonData = [
    { metal: '22K Gold', comp: '91.6% gold, mixed with alloys', durability: 'More durable than 24K', color: 'Rich yellow', use: 'Traditional wear, olive & brown skin tones', notes: 'Retains high value & cultural significance' },
    { metal: '18K Gold', comp: '75% gold, mixed with stronger alloys', durability: 'Balanced durability & purity', color: 'Warm yellow', use: 'Luxury jewellery, daily wear', notes: 'Perfect balance of elegance & strength' },
    { metal: '14K Gold', comp: '58.3% gold, higher alloy content', durability: 'Highly durable, scratch-resistant', color: 'Subdued yellow', use: 'Active lifestyles, fair to medium skin tones', notes: 'More affordable, great for engagement rings' },
    { metal: 'White Gold', comp: '14K or 18K gold mixed with palladium/silver', durability: 'Durable, requires rhodium plating', color: 'Silvery-white', use: 'Modern & timeless jewellery', notes: 'Needs occasional re-plating for brightness' },
    { metal: 'Rose Gold', comp: '14K or 18K gold mixed with copper', durability: 'Strong due to copper content', color: 'Pinkish hue', use: 'Romantic, vintage-style jewellery', notes: 'Feminine and unique appearance' },
    { metal: 'Sterling Silver', comp: '92.5% silver, 7.5% alloy (usually copper)', durability: 'Can tarnish but easily cleaned', color: 'Bright white', use: 'Affordable & stylish daily wear', notes: 'Lightweight and hypoallergenic' },
    { metal: 'Platinum', comp: '95% pure platinum', durability: 'Most durable, retains shine forever', color: 'Naturally white', use: 'High-end, diamond jewellery', notes: 'Hypoallergenic, rare, & prestigious' },
  ];

  return (
    <div className="max-w-300 mx-auto px-4 pt-14 font-figtree text-gray-800 leading-relaxed">
      
      {/* Intro Section */}
      <div className="mb-12">
        <h1 className="font-abhaya text-3xl md:text-4xl font-bold text-black mb-8 leading-tight text-center">
          Gold, Silver or Platinum? The Ultimate Guide to Choosing the Best Metal for Your Jewelry
        </h1>
        <div className="space-y-4 text-lg text-gray-600 ">
          <p>
            At <Link href="/" className="text-primary no-underline font-medium">Lucira Jewelry</Link>, 
            we meticulously source our metals to ensure exceptional quality, longevity, and comfort, so every piece remains as timeless as the moments it represents. 
            Jewellery is not just a product, but a lifelong connection with the milestones achieved and the occasions celebrated.
          </p>
          <p>
            The metal you choose decides the overall look, feel and the longevity of your jewellery. Let&apos;s break down the characteristics 
            of the best metals to help you make the best buying decision.
          </p>
        </div>
      </div>

      <div className="space-y-16">
        
        {/* Why Choose Gold */}
        <section className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-primary px-6 py-3">
            <h2 className="font-abhaya text-2xl text-white">Why Choose Gold</h2>
          </div>
          <div className="p-6 md:p-10 flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <Image
                src="https://luciraonline.myshopify.com/cdn/shop/files/LJ-PGR013YG_1.jpg"
                alt="Gold Jewelry"
                width={500}
                height={500}
                priority
                className="w-full rounded-md shadow"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="md:w-2/3 space-y-6">
              <p className="italic">Gold has been treasured for centuries and continues to be a symbol of prosperity and elegance in jewelry design.</p>
              <div className="bg-accent/10 p-5 rounded-lg">
                <h4 className="font-abhaya text-2xl font-bold text-primary mb-2">Benefits of Gold</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm md:columns-2">
                  <li>Resistant to corrosion</li>
                  <li>Most people are not allergic to gold</li>
                  <li>Vast variety in intricate designs</li>
                  <li>Used for generations</li>
                  <li>Associated with grand occasions</li>
                </ul>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-abhaya text-xl font-bold mb-1">24k Gold (Pure Gold)</h3>
                  <p className="text-sm text-gray-600">99.9% gold, highly soft, and not ideal for daily wear.</p>
                </div>
                <div>
                  <h3 className="font-abhaya text-xl font-bold mb-1">22k Gold</h3>
                  <p className="text-sm text-gray-600">91.6% pure gold, has a rich yellow hue. Complements olive and brown skin tones.</p>
                </div>
                <div>
                  <h3 className="font-abhaya text-xl font-bold mb-1">18K Gold</h3>
                  <p className="text-sm text-gray-600">75% gold, perfect balance of purity and durability. Luxurious appeal.</p>
                </div>
                <div>
                  <h3 className="font-abhaya text-xl font-bold mb-1">14K Gold</h3>
                  <p className="text-sm text-gray-600">58.3% gold, scratch-resistant. Perfect for fair to medium skin tones.</p>
                </div>
              </div>
              <div className="bg-accent/10 p-4 border-l-4 rounded-lg border-primary">
                <h4 className="font-abhaya text-xl font-bold text-primary">Pro Tip to Buy Gold</h4>
                <p className="text-sm italic">Always check for a hallmark or a karat stamp to ensure authenticity. Choose 18K or 14K for daily wear.</p>
              </div>
              <div className='flex justify-center align-center'>
                <Link href="/collections/engagement-rings-yellow-gold" className="inline-block bg-primary text-white px-8 py-3 shadow-md rounded-lg hover:opacity-90 transition-opacity">Browse Gold</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sterling Silver Section */}
        <section className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-primary px-6 py-3">
            <h2 className="font-abhaya text-2xl text-white">Sterling Silver For You to Wear Everyday</h2>
          </div>
          <div className="p-6 md:p-10 flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <Image
                src="https://cdn.shopify.com/s/files/1/0739/8516/3482/files/LJ-R00341WG_1.webp"
                alt="Silver Jewelry"
                width={500}
                height={500}
                className="w-full rounded-md shadow"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="md:w-2/3 space-y-4">
              <p>Just like pure gold, pure silver is too soft to ensure durability. Sterling silver (92.5% silver and 7.5% alloy) provides an elegant look without costing a fortune.</p>
              <p>Silver has a tendency to tarnish, but with proper care, this process can be slowed down drastically.</p>
              <div className="bg-accent/10 p-5 rounded-lg">
                <h4 className="font-abhaya text-2xl font-bold text-primary mb-2">Why Choose Sterling Silver?</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Affordable & stylish</li>
                  <li>Easy to shape into intricate designs</li>
                  <li>Lightweight and comfortable for daily wear</li>
                  <li>Hypoallergenic and has health benefits</li>
                </ul>
              </div>
              <div className="bg-accent/10 p-4 border-l-4 rounded-lg border-primary">
                <h4 className="font-abhaya text-xl font-bold text-primary">Pro Tip to Buy Sterling Silver</h4>
                <p className="text-sm italic">Look for &apos;925&apos; stamp to ensure genuine sterling silver.</p>
              </div>
              <div className='flex justify-center align-center'>
                <Link href="/collections/engagement-rings-silver" className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">Browse Silver</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Platinum Section */}
        <section className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-primary px-6 py-3">
            <h2 className="font-abhaya text-2xl text-white">Platinum: Why Is It The Most Desired Choice of Metal</h2>
          </div>
          <div className="p-6 md:p-10 flex flex-col md:flex-row gap-10">
            <div className="md:w-1/3">
              <Image
                src="https://luciraonline.myshopify.com/cdn/shop/files/LJ-R00820WG_1.jpg"
                alt="Platinum Jewelry"
                width={500}
                height={500}
                className="w-full rounded-md shadow"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
            </div>
            <div className="md:w-2/3 space-y-4">
              <p>If you are someone seeking luster, luxury and longevity, platinum is your answer. Unlike white gold, it doesn&apos;t require a rhodium plating because of its natural whiteness.</p>
              <div className="bg-accent/10 p-5 rounded-lg">
                <h4 className="font-abhaya text-2xl font-bold text-primary mb-2">Why Choose Platinum?</h4>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>It is denser and more durable than gold</li>
                  <li>Hypoallergenic and perfect for sensitive skin</li>
                  <li>Valued higher than most metals</li>
                  <li>Exclusivity (Up to 30 times rarer than gold)</li>
                </ul>
              </div>
              <div className="bg-accent/10 p-4 border-l-4 rounded-lg border-primary">
                <h4 className="font-abhaya text-xl font-bold text-primary">Pro Tip to Buy Platinum</h4>
                <p className="text-sm italic">Ensure it is certified and has a purity stamp such as &quot;PT950&quot;</p>
              </div>
              <div className='flex justify-center align-center'>
                <Link href="/collections/platinum-engagement-bridal-rings" className="inline-block bg-primary text-white px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">Browse Platinum</Link>
                </div>
            </div>
          </div>
        </section>

        {/* Gold Colors Section */}
        <section className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
          <div className="bg-primary px-6 py-3">
            <h2 className="font-abhaya text-2xl text-white">Which Color Gold Looks Best?</h2>
          </div>
          <div className="p-6 md:p-10 space-y-8">
            <p className="text-lg">Our fine gold accessories come in three colors - yellow, white and rose gold, each offering its own finesse and lasting durability.</p>
            <div className="grid grid-row gap-8">
              <div className="space-y-2">
                <h3 className="font-abhaya text-2xl font-bold border-b border-gray-200 pb-1">Yellow Gold</h3>
                <p className="text-base">Yellow Gold is a warm-colored metal and a classic favourite for engagement rings. By nature, gold is yellow, but in its purest form, it can look garish. The warm hue of yellow gold creates an aesthetic, sunny hue.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-abhaya text-2xl font-bold border-b border-gray-200 pb-1">White Gold</h3>
                <p className="text-base">White gold is a 24K gold alloyed with 'white' metals such as palladium or silver to give a white appearance while the gold may still show a little yellow hue. For this, some pieces of jewellery have a rhodium plating to make it appear entirely white. The less yellow a gold jewellery piece is, the more durable and so, white gold is chosen by most because of the luxurious appeal it holds while also having the desired longevity.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-abhaya text-2xl font-bold border-b border-gray-200 pb-1">Rose Gold</h3>
                <p className="text-base">Rose gold jewelry is trending and for a reason - its vintage appeal with the ability to stand out with all kinds of outfits makes it versatile. It has garnered the attention of fashion lovers because of its feminine and luxurious touch. The rosy look gives a romantic tone and is common in engagement rings.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table Section */}
        <section className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="bg-primary px-6 py-3">
            <h2 className="font-abhaya text-2xl text-white">Metal Comparison Guide</h2>
          </div>
          <div className="p-6 md:p-10">
            <p className="mb-6">To make it easier for you to pick the perfect one, we have created this quick metal comparison table that breaks down the key features based on your lifestyle.</p>
            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-accent font-abhaya text-white text-lg uppercase tracking-wider">
                    <th className="p-4 border border-gray-200">Metal</th>
                    <th className="p-4 border border-gray-200">Composition</th>
                    <th className="p-4 border border-gray-200">Durability</th>
                    <th className="p-4 border border-gray-200">Color</th>
                    <th className="p-4 border border-gray-200">Common Use</th>
                    <th className="p-4 border border-gray-200">Notes</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 border border-gray-200 font-bold text-gray-900">{row.metal}</td>
                      <td className="p-4 border border-gray-200">{row.comp}</td>
                      <td className="p-4 border border-gray-200">{row.durability}</td>
                      <td className="p-4 border border-gray-200">{row.color}</td>
                      <td className="p-4 border border-gray-200">{row.use}</td>
                      <td className="p-4 border border-gray-200 italic text-gray-500">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
